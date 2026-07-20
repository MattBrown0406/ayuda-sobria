import type { ZoomApi, ZoomMeeting, ZoomRegistrant } from "./types.ts";

interface ZoomClientOptions {
  accountId: string;
  clientId: string;
  clientSecret: string;
  hostUserId: string;
  fetchImpl?: typeof fetch;
}

interface ZoomMeetingListResponse {
  meetings?: Array<{
    id?: number | string;
    join_url?: string;
    start_url?: string;
    start_time?: string;
    topic?: string;
  }>;
  next_page_token?: string;
}

export function createZoomClient(options: ZoomClientOptions): ZoomApi {
  const fetchImpl = options.fetchImpl ?? fetch;
  let accessToken: string | null = null;
  let accessTokenExpiresAt = 0;

  async function token(): Promise<string> {
    if (accessToken && Date.now() < accessTokenExpiresAt - 30_000) return accessToken;
    const authorization = Buffer.from(`${options.clientId}:${options.clientSecret}`).toString(
      "base64",
    );
    const response = await fetchImpl(
      `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(options.accountId)}`,
      { method: "POST", headers: { Authorization: `Basic ${authorization}` } },
    );
    if (!response.ok) throw new Error(`Zoom OAuth failed (${response.status})`);
    const body = (await response.json()) as { access_token?: string; expires_in?: number };
    if (!body.access_token) throw new Error("Zoom OAuth response missing access token");
    accessToken = body.access_token;
    accessTokenExpiresAt = Date.now() + Math.max(60, body.expires_in ?? 3600) * 1000;
    return accessToken;
  }

  async function zoomFetch(path: string, init: RequestInit): Promise<Response> {
    const response = await fetchImpl(`https://api.zoom.us/v2${path}`, {
      ...init,
      headers: {
        ...init.headers,
        Authorization: `Bearer ${await token()}`,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) throw new Error(`Zoom API failed (${response.status})`);
    return response;
  }

  return {
    async findMeeting(input): Promise<ZoomMeeting | null> {
      const userId = options.hostUserId;
      let pageToken = "";
      for (let page = 0; page < 5; page += 1) {
        const params = new URLSearchParams({ type: "upcoming", page_size: "100" });
        if (pageToken) params.set("next_page_token", pageToken);
        const response = await zoomFetch(
          `/users/${encodeURIComponent(userId)}/meetings?${params}`,
          { method: "GET" },
        );
        const body = (await response.json()) as ZoomMeetingListResponse;
        const requestedStart = Date.parse(input.startTime);
        const found = body.meetings?.find(
          (meeting) =>
            meeting.topic === input.topic &&
            typeof meeting.start_time === "string" &&
            Date.parse(meeting.start_time) === requestedStart,
        );
        if (found?.id && found.join_url) {
          return {
            id: String(found.id),
            joinUrl: found.join_url,
            startUrl: found.start_url,
            startTime: found.start_time,
            topic: found.topic,
          };
        }
        pageToken = body.next_page_token ?? "";
        if (!pageToken) break;
      }
      return null;
    },

    async createMeeting(input): Promise<ZoomMeeting> {
      const userId = options.hostUserId;
      const response = await zoomFetch(`/users/${encodeURIComponent(userId)}/meetings`, {
        method: "POST",
        body: JSON.stringify({
          topic: input.topic,
          type: 2,
          start_time: input.startTime,
          duration: 75,
          timezone: input.timezone,
          settings: {
            host_video: true,
            participant_video: true,
            approval_type: 0,
            registration_type: 1,
            waiting_room: false,
            join_before_host: false,
            mute_upon_entry: false,
            audio: "both",
            auto_recording: "cloud",
          },
        }),
      });
      const body = (await response.json()) as {
        id?: number | string;
        join_url?: string;
        start_url?: string;
        start_time?: string;
        topic?: string;
      };
      if (!body.id || !body.join_url) throw new Error("Zoom meeting response incomplete");
      return {
        id: String(body.id),
        joinUrl: body.join_url,
        startUrl: body.start_url,
        startTime: body.start_time,
        topic: body.topic,
      };
    },

    async findRegistrant(meetingId, email): Promise<ZoomRegistrant | null> {
      let pageToken = "";
      for (let page = 0; page < 5; page += 1) {
        const params = new URLSearchParams({ status: "approved", page_size: "300" });
        if (pageToken) params.set("next_page_token", pageToken);
        const response = await zoomFetch(
          `/meetings/${encodeURIComponent(meetingId)}/registrants?${params}`,
          {
            method: "GET",
          },
        );
        const body = (await response.json()) as {
          registrants?: Array<{
            id?: string;
            registrant_id?: string;
            email?: string;
            join_url?: string;
          }>;
          next_page_token?: string;
        };
        const found = body.registrants?.find(
          (item) => item.email?.toLowerCase() === email.toLowerCase(),
        );
        const id = found?.registrant_id ?? found?.id;
        if (id && found?.join_url) return { id, joinUrl: found.join_url, email: found.email };
        pageToken = body.next_page_token ?? "";
        if (!pageToken) break;
      }
      return null;
    },

    async addRegistrant(meetingId, input): Promise<ZoomRegistrant> {
      const response = await zoomFetch(`/meetings/${encodeURIComponent(meetingId)}/registrants`, {
        method: "POST",
        body: JSON.stringify({
          email: input.email,
          first_name: input.firstName,
          last_name: input.lastName || "",
          auto_approve: true,
        }),
      });
      const body = (await response.json()) as { registrant_id?: string; join_url?: string };
      if (!body.registrant_id || !body.join_url)
        throw new Error("Zoom registrant response incomplete");
      return { id: body.registrant_id, joinUrl: body.join_url, email: input.email };
    },

    async removeRegistrant(meetingId, registrantId): Promise<void> {
      await zoomFetch(
        `/meetings/${encodeURIComponent(meetingId)}/registrants/${encodeURIComponent(registrantId)}`,
        { method: "DELETE" },
      );
    },
  };
}

export function zoomClientFromEnv(fetchImpl?: typeof fetch): ZoomApi {
  const accountId = process.env.ZOOM_ACCOUNT_ID;
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;
  const hostUserId = process.env.ZOOM_HOST_USER_ID;
  if (!accountId || !clientId || !clientSecret || !hostUserId)
    throw new Error(
      "Zoom credentials and a dedicated ZOOM_HOST_USER_ID for La Sobremesa are required",
    );
  return createZoomClient({
    accountId,
    clientId,
    clientSecret,
    hostUserId,
    fetchImpl,
  });
}
