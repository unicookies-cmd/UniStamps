// config.js — UniStamps (local-only, no backend)
window.UNISTAMPS_CONFIG = {
  brandHandle: "@eatunicookies",
  staffPin: "4821", // CHANGE THIS
  maxStamps: 10,
  milestones: {
    3: {
      title: "UniCircle unlocked",
      body:
        "You’ve been showing up.\n\nUniCircle is weekly inspiration (email) for emotional intelligence + nervous system regulation.\n\nMonthly invite: first month $9, cancel anytime after.",
      ctaA: "I want UniCircle",
      ctaB: "Just today’s stamp"
    },
    5: {
      title: "Reward unlocked",
      body: "Free cookie earned.\nShow staff to claim today.",
      rewardLabel: "Reward A — Free Cookie"
    },
    8: {
      title: "Reward unlocked",
      body: "Merch token earned.\nShow staff to claim today.",
      rewardLabel: "Reward C — Merch Token"
    },
    10: {
      title: "Final unlock",
      body: "You’ve earned entry into the 3-month subscription battle.\nShow staff to claim.\n\nAfter claim, your stamps reset.",
      rewardLabel: "Reward B — Battle Entry"
    }
  }
};
