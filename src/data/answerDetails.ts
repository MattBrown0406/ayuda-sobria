export type AnswerNextStep = "family_squares" | "private_coaching" | "intervention_readiness";

export interface AnswerDetail {
  category: string;
  shortAnswer: string;
  bestNextStep: AnswerNextStep;
}

export const ANSWER_DETAILS: Record<string, AnswerDetail> = {
  "where-should-family-start-addiction-chaos": {
    category: "Empieza aquí",
    shortAnswer:
      "Empieza con el apoyo menos intenso que siga siendo honesto sobre el riesgo: La Sobremesa gratuita para educación y apoyo, coaching privado para un plan concreto, o evaluación de intervención si aumentan el peligro y el rechazo al tratamiento.",
    bestNextStep: "family_squares",
  },
  "what-is-family-squares-meeting": {
    category: "La Sobremesa",
    shortAnswer:
      "La Sobremesa es una reunión gratuita por Zoom cada lunes para padres, parejas, hermanos, hijos adultos y otros seres queridos que necesitan apoyo, educación y mayor claridad antes de tomar la próxima decisión.",
    bestNextStep: "family_squares",
  },
  "when-book-private-family-coaching": {
    category: "Coaching privado",
    shortAnswer:
      "Reserva coaching privado cuando el lunes queda demasiado lejos, la pregunta es demasiado personal para un grupo o la familia necesita un plan directo sobre límites, tratamiento, recaída o alineación familiar.",
    bestNextStep: "private_coaching",
  },
  "when-is-addiction-intervention-level": {
    category: "Preparación para intervención",
    shortAnswer:
      "La situación puede requerir una intervención cuando se rechaza el tratamiento, hay riesgo de sobredosis, la familia está dividida, las consecuencias aumentan o las mismas promesas terminan una y otra vez en la misma crisis.",
    bestNextStep: "intervention_readiness",
  },
  "what-if-loved-one-refuses-treatment": {
    category: "Rechazo al tratamiento",
    shortAnswer:
      "El rechazo al tratamiento no termina el trabajo de la familia. La familia todavía puede eliminar mensajes contradictorios, sostener límites, mantener disponible el apoyo para la recuperación y decidir si necesita coaching o planificación de intervención.",
    bestNextStep: "private_coaching",
  },
  "what-if-we-cannot-wait-until-monday": {
    category: "Coaching privado",
    shortAnswer:
      "Si la situación no puede esperar a La Sobremesa, reserva coaching privado o llama para recibir orientación. Usa el apoyo gratuito para estabilizarte y la ayuda privada cuando apremian el tiempo, la seguridad o una decisión concreta.",
    bestNextStep: "private_coaching",
  },
  "should-we-stop-giving-money-addiction": {
    category: "Límites",
    shortAnswer:
      "A menudo la familia necesita dejar de entregar dinero en efectivo, pero el límite debe planificarse. Puede seguir apoyando tratamiento verificado, seguridad y recuperación mientras deja de financiar conductas que protegen la adicción activa.",
    bestNextStep: "private_coaching",
  },
  "how-do-we-set-boundaries-with-adult-child": {
    category: "Límites",
    shortAnswer:
      "Pon límites sobre lo que la familia sí controla: dinero, vivienda, transporte, comunicación, secretos y apoyo para la recuperación. El límite debe ser compasivo, específico y posible de cumplir.",
    bestNextStep: "family_squares",
  },
  "what-should-family-do-after-relapse": {
    category: "Recaída",
    shortAnswer:
      "Responde a la recaída primero con seguridad y después con claridad. Evita el pánico, el castigo o fingir que no pasó nada. La familia necesita un plan para tratamiento, límites, responsabilidad y próximos pasos.",
    bestNextStep: "private_coaching",
  },
  "can-i-attend-family-squares-if-loved-one-not-sober": {
    category: "La Sobremesa",
    shortAnswer:
      "Sí. La Sobremesa es para familias afectadas por la adicción, ya sea que su ser querido esté sobrio, consumiendo, en tratamiento, en recaída, rechazando ayuda o en cualquier punto intermedio.",
    bestNextStep: "family_squares",
  },
  "what-question-should-i-ask-family-squares": {
    category: "La Sobremesa",
    shortAnswer:
      "Lleva la pregunta que se repite en casa: qué hacer ahora, qué límite sostener, si el tratamiento es realista, cómo responder a una recaída o si la situación ya requiere evaluar una intervención.",
    bestNextStep: "family_squares",
  },
  "when-should-family-call-sober-helpline": {
    category: "Empieza aquí",
    shortAnswer:
      "Llama cuando necesites decidir el próximo paso: apoyo gratuito, coaching privado, preguntas sobre tratamiento o evaluación de intervención. AyudaSobria no sustituye los servicios de emergencia ni mantiene un directorio de proveedores en español.",
    bestNextStep: "family_squares",
  },
  "should-we-stage-an-intervention": {
    category: "Preparación para intervención",
    shortAnswer:
      "Considera planificar una intervención cuando se rechaza el tratamiento, el riesgo aumenta, las conversaciones normales ya no funcionan y la familia necesita un plan unificado en lugar de otra confrontación emocional.",
    bestNextStep: "intervention_readiness",
  },
  "how-do-i-get-my-spouse-into-treatment": {
    category: "Adicción en la pareja",
    shortAnswer:
      "Por lo general no puedes forzar el tratamiento con una sola conversación. Enfócate en la seguridad, el dinero, los hijos, los límites, las opciones de tratamiento y si necesitan coaching privado o evaluar una intervención.",
    bestNextStep: "private_coaching",
  },
  "what-do-i-say-when-they-relapse": {
    category: "Recaída",
    shortAnswer:
      "Di menos de lo que el pánico te impulsa a decir. Empieza por la seguridad, reconoce lo ocurrido, evita avergonzar y pasa con rapidez al plan: apoyo para el tratamiento, límites y próximos pasos.",
    bestNextStep: "private_coaching",
  },
  "should-i-let-loved-one-come-home-after-rehab": {
    category: "Después del tratamiento",
    shortAnswer:
      "Solo si el plan para el hogar apoya la recuperación y protege a quienes viven allí. Antes del alta, acuerden seguimiento clínico, dinero, transporte, respuesta ante recaídas y condiciones de seguridad.",
    bestNextStep: "private_coaching",
  },
  "what-if-my-adult-child-is-using-in-my-home": {
    category: "Hijos adultos",
    shortAnswer:
      "Trata el consumo activo dentro del hogar como un asunto de seguridad y límites. La familia necesita condiciones claras para la vivienda, una opción que apoye la recuperación y un plan para lo que cambiará si el consumo continúa.",
    bestNextStep: "private_coaching",
  },
  "is-this-bad-enough-for-treatment": {
    category: "Decisiones de tratamiento",
    shortAnswer:
      "Si el consumo causa riesgo, daño en las relaciones, problemas laborales, legales o de salud, secretos, recaídas o promesas rotas repetidas, es lo suficientemente serio como para buscar orientación profesional.",
    bestNextStep: "family_squares",
  },
  "what-if-they-keep-promising-to-change": {
    category: "Rechazo al tratamiento",
    shortAnswer:
      "Las promesas importan menos que el patrón. Si la misma promesa sigue terminando en la misma crisis, la familia necesita límites, claridad sobre tratamiento y posiblemente coaching o planificación de intervención.",
    bestNextStep: "private_coaching",
  },
  "should-we-pay-for-rehab": {
    category: "Decisiones de tratamiento",
    shortAnswer:
      "Pagar tratamiento puede apoyar la recuperación cuando existe un plan real, expectativas claras y límites familiares. Se vuelve facilitador cuando el dinero reemplaza la responsabilidad y no cambia el patrón.",
    bestNextStep: "private_coaching",
  },
  "how-do-we-talk-without-starting-a-fight": {
    category: "Conversaciones familiares",
    shortAnswer:
      "Elige el momento, habla de hechos concretos, describe el impacto sin poner etiquetas, evita discutir si la persona es o no «adicta» y decide el próximo paso antes de iniciar la conversación.",
    bestNextStep: "family_squares",
  },
  "what-if-family-members-disagree": {
    category: "Alineación familiar",
    shortAnswer:
      "El desacuerdo familiar es común y puede convertirse en parte del patrón. Empiecen por alinearse sobre seguridad, dinero, vivienda, apoyo para tratamiento y lo que la familia dejará de hacer.",
    bestNextStep: "private_coaching",
  },
  "what-if-im-afraid-they-will-overdose": {
    category: "Seguridad",
    shortAnswer:
      "Toma el temor de sobredosis como una señal de seguridad. Ante peligro inmediato llama al 911 o al servicio local de emergencias; si hay opioides, ten naloxona disponible y aprende a usarla. No esperes para buscar orientación profesional.",
    bestNextStep: "intervention_readiness",
  },
  "what-if-they-are-functioning": {
    category: "Decisiones de tratamiento",
    shortAnswer:
      "Parecer funcional no significa que la adicción sea inofensiva. Observa secretos, salud, dinero, crianza, conducción, trabajo, cambios emocionales y si el patrón está empeorando.",
    bestNextStep: "family_squares",
  },
  "should-we-call-treatment-center-first": {
    category: "Decisiones de tratamiento",
    shortAnswer:
      "Llama a un centro cuando necesites detalles de su programa. Busca orientación familiar cuando necesites decidir el nivel de atención, el momento o el enfoque, y confirma directamente que el programa realmente ofrezca sus servicios en español.",
    bestNextStep: "private_coaching",
  },
  "does-our-family-need-freedom-interventions": {
    category: "Preparación para intervención",
    shortAnswer:
      "Una intervención profesional puede ser el camino adecuado cuando se rechaza el tratamiento, el riesgo aumenta, la familia está dividida y un plan estructurado es más seguro que otra conversación improvisada.",
    bestNextStep: "intervention_readiness",
  },
  "what-if-they-leave-treatment-early": {
    category: "Después del tratamiento",
    shortAnswer:
      "No te apresures a borrar todas las consecuencias. Enfócate en la seguridad, qué cambió, si la persona volverá a participar en atención profesional y qué apoyo familiar sigue favoreciendo la recuperación.",
    bestNextStep: "private_coaching",
  },
  "what-if-they-are-lying-about-using": {
    category: "Conversaciones familiares",
    shortAnswer:
      "No conviertas toda la conversación en demostrar la mentira. Enfócate en el patrón, el impacto, la preocupación de seguridad y lo que hará la familia si no regresa la honestidad.",
    bestNextStep: "private_coaching",
  },
  "should-i-give-an-ultimatum": {
    category: "Límites",
    shortAnswer:
      "No uses un ultimátum que no puedas cumplir. Un límite más sano explica lo que tú harás si el patrón continúa y mantiene disponible el apoyo real para la recuperación.",
    bestNextStep: "private_coaching",
  },
};
