import type { RegistrationInput, RegistrationMailer, RegistrationStore, ZoomApi } from "./types.ts";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cleaned(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function parseRegistrationInput(value: unknown): RegistrationInput {
  if (!value || typeof value !== "object") throw new Error("INVALID_REGISTRATION");
  const body = value as Record<string, unknown>;
  const fullName = cleaned(body.fullName ?? body.nombre, 120);
  const email = cleaned(body.email, 254).toLowerCase();
  const occurrenceId = cleaned(body.occurrenceId, 64);
  if (!fullName || !EMAIL_PATTERN.test(email)) throw new Error("INVALID_REGISTRATION");
  if (
    occurrenceId &&
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(occurrenceId)
  ) {
    throw new Error("INVALID_REGISTRATION");
  }
  if (body.consentConfidentiality !== true) throw new Error("CONFIDENTIALITY_REQUIRED");
  const requestFollowUp = body.requestFollowUp === true;
  const preferredContactDate = requestFollowUp
    ? cleaned(body.preferredContactDate, 10) || undefined
    : undefined;
  const preferredContactTime = requestFollowUp
    ? cleaned(body.preferredContactTime, 8) || undefined
    : undefined;
  if (preferredContactDate) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(preferredContactDate)) throw new Error("INVALID_REGISTRATION");
    const parsedDate = new Date(`${preferredContactDate}T00:00:00Z`);
    if (
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== preferredContactDate
    ) {
      throw new Error("INVALID_REGISTRATION");
    }
  }
  if (
    preferredContactTime &&
    !/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(preferredContactTime)
  ) {
    throw new Error("INVALID_REGISTRATION");
  }
  return {
    occurrenceId,
    fullName,
    email,
    phone: cleaned(body.phone ?? body.telefono, 50) || undefined,
    location: cleaned(body.location ?? body.pais, 120) || undefined,
    relationship: cleaned(body.relationship ?? body.relacion, 120) || undefined,
    situation: cleaned(body.situation ?? body.situacion, 2000) || undefined,
    question: cleaned(body.question ?? body.pregunta, 2000) || undefined,
    autoRegister: body.autoRegister === true,
    requestFollowUp,
    preferredContactDate,
    preferredContactTime,
    preferredTimezone: requestFollowUp
      ? cleaned(body.preferredTimezone, 100) || undefined
      : undefined,
    consentConfidentiality: true,
    consentUpdates: body.consentUpdates === true || body.consentSms === true,
  };
}

function splitName(fullName: string) {
  const [firstName, ...rest] = fullName.trim().split(/\s+/);
  return { firstName, lastName: rest.join(" ") || undefined };
}

async function deliverConfirmation(input: {
  recordId: string;
  registration: RegistrationInput;
  occurrence: NonNullable<Awaited<ReturnType<RegistrationStore["getReadyOccurrence"]>>>;
  joinUrl: string;
  store: RegistrationStore;
  mailer?: RegistrationMailer;
}) {
  if (!input.mailer) return { emailSent: false, emailConfigured: false };
  try {
    await input.mailer.sendConfirmation({
      registrationId: input.recordId,
      fullName: input.registration.fullName,
      email: input.registration.email,
      occurrence: input.occurrence,
      joinUrl: input.joinUrl,
    });
    await input.store.completeConfirmationEmail(input.recordId);
    return { emailSent: true, emailConfigured: true };
  } catch (error) {
    await input.store.failConfirmationEmail(
      input.recordId,
      error instanceof Error ? error.message.slice(0, 500) : "Confirmation email failed",
    );
    return { emailSent: false, emailConfigured: true };
  }
}

export async function registerForOccurrence(input: {
  registration: RegistrationInput;
  store: RegistrationStore;
  zoom: ZoomApi;
  mailer?: RegistrationMailer;
  now?: Date;
}) {
  const occurrence = input.registration.occurrenceId
    ? await input.store.getReadyOccurrence(input.registration.occurrenceId)
    : await input.store.getUpcomingReadyOccurrence((input.now ?? new Date()).toISOString());
  if (!occurrence?.zoomMeetingId) throw new Error("OCCURRENCE_NOT_AVAILABLE");
  const registrationInput = { ...input.registration, occurrenceId: occurrence.id };
  const claim = await input.store.claimRegistration(registrationInput);
  if (!claim.claimed) {
    if (claim.value.status === "registered" && claim.value.zoomJoinUrl) {
      let delivery = {
        emailSent: claim.value.confirmationEmailStatus === "sent",
        emailConfigured: Boolean(input.mailer),
      };
      if (claim.value.confirmationEmailStatus !== "sent") {
        delivery = await deliverConfirmation({
          recordId: claim.value.id,
          registration: registrationInput,
          occurrence,
          joinUrl: claim.value.zoomJoinUrl,
          store: input.store,
          mailer: input.mailer,
        });
      }
      return {
        registration: claim.value,
        occurrence,
        created: false,
        recovered: false,
        ...delivery,
      };
    }
    throw new Error("REGISTRATION_BUSY");
  }
  try {
    // Zoom does not expose a create-registrant idempotency key. Adopt an exact
    // existing email match before POSTing so retries after a DB failure remain safe.
    const existing = await input.zoom.findRegistrant(
      occurrence.zoomMeetingId,
      registrationInput.email,
    );
    const registrant =
      existing ??
      (await input.zoom.addRegistrant(occurrence.zoomMeetingId, {
        email: registrationInput.email,
        ...splitName(registrationInput.fullName),
      }));
    const registration = await input.store.completeRegistration(claim.value.id, registrant);
    const delivery = await deliverConfirmation({
      recordId: registration.id,
      registration: registrationInput,
      occurrence,
      joinUrl: registration.zoomJoinUrl ?? registrant.joinUrl,
      store: input.store,
      mailer: input.mailer,
    });
    return {
      registration,
      occurrence,
      created: !existing,
      recovered: Boolean(existing),
      ...delivery,
    };
  } catch (error) {
    await input.store.failRegistration(
      claim.value.id,
      error instanceof Error ? error.message.slice(0, 500) : "Zoom registration failed",
    );
    throw error;
  }
}

export function createRegistrationHandler(deps: {
  store: RegistrationStore;
  zoom: ZoomApi;
  mailer?: RegistrationMailer;
  now?: () => Date;
}) {
  return async (request: Request): Promise<Response> => {
    let body: unknown;
    try {
      const raw = await request.text();
      if (new TextEncoder().encode(raw).byteLength > 16_384) {
        return Response.json({ error: "Solicitud demasiado grande." }, { status: 413 });
      }
      body = JSON.parse(raw);
    } catch {
      return Response.json({ error: "Solicitud inválida." }, { status: 400 });
    }
    let registration: RegistrationInput;
    try {
      registration = parseRegistrationInput(body);
    } catch (error) {
      const message =
        error instanceof Error && error.message === "CONFIDENTIALITY_REQUIRED"
          ? "Se requiere el consentimiento de confidencialidad."
          : "Completa los campos requeridos.";
      return Response.json({ error: message }, { status: 400 });
    }
    try {
      const result = await registerForOccurrence({
        registration,
        ...deps,
        now: deps.now?.(),
      });
      return Response.json({
        ok: true,
        created: result.created,
        recovered: result.recovered ?? false,
        registrationId: result.registration.id,
        occurrenceDate: result.occurrence.occurrenceDate,
        startsAt: result.occurrence.startsAt,
        // Personalized Zoom links are delivered only to the submitted mailbox. Never expose
        // a stored or newly-created join URL through this public endpoint, because email alone
        // does not prove ownership and duplicate submissions could otherwise steal access.
        joinUrl: null,
        emailSent: result.emailSent,
        emailConfigured: result.emailConfigured,
      });
    } catch (error) {
      if (error instanceof Error && error.message === "OCCURRENCE_NOT_AVAILABLE") {
        return Response.json(
          { error: "La próxima reunión todavía no está disponible para registro." },
          { status: 404 },
        );
      }
      if (error instanceof Error && error.message === "REGISTRATION_BUSY") {
        return Response.json(
          { error: "El registro ya se está procesando. Inténtalo de nuevo en un momento." },
          { status: 409 },
        );
      }
      return Response.json(
        { error: "No se pudo completar el registro con Zoom." },
        { status: 502 },
      );
    }
  };
}
