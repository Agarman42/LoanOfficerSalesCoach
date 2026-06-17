/**
 * Weekend planning rules — shared across weekly plans, social calendars, and AI prompts.
 * Saturdays & Sundays = rest, family, recharge; optional light prep only.
 */
(function () {
  'use strict';

  const PROMPT_BLOCK = `WEEKEND RULES (Saturday & Sunday — non-negotiable):
- Saturday and Sunday are for REST, family, recharging, and personal life — not heavy prospecting or networking.
- NEVER assign on weekends: networking events, "collect X contacts," open houses, pop-bys, phone blitzes, cold outreach blocks, executive calls, multi-hour work sessions, or mandatory hustling.
- Saturday: 0–1 optional light block max (15–30 min total). Acceptable only if framed optional: quick Shape glance for Tue calls, jot 1–2 social ideas, light week preview, or a casual personal post — not work errands.
- Sunday: 0–1 optional light block max (15–20 min). Acceptable: 5-min week-ahead preview, pick top 3 Tuesday priorities, lay out Monday — family and recovery first.
- Weekend tasks must feel restorative or lightly preparatory. Good: "Optional 10-min Sunday: preview Shape for Tuesday's first three calls." Bad: "Attend local networking event and collect contacts."
- Heavy metrics (outreach, quality conversations, exec calls, partner meetings) belong Monday–Friday, especially Tuesday–Thursday.`;

  const SOCIAL_CALENDAR_NOTE = `For every Saturday and Sunday in the calendar: ideas must be personal/lifestyle/authentic (family, hobbies, rest, community fun, gratitude) — NOT work assignments, networking tasks, or "go prospect" captions. Weekends are recharge content, not hustle content.`;

  const WEEKEND_DAYS = ['Saturday', 'Sunday'];
  const HEAVY_WORK_RE = /networking|collect \d+|open house|pop-?by|phone block|cold (call|outreach)|outreach block|exec(utive)? (call|leadership)|quality conversation|referral partner|realtor contact|attend .+ event|host .+ event|prospecting block|partner (meeting|lunch|coffee)|shape (calls|outreach)|linkedin outreach|facebook outreach/i;

  const LIGHT_WEEKEND_BLOCKS = {
    Saturday: {
      time: 'Optional — 15 min AM',
      focus: 'Light prep (optional)',
      why: 'Only if you want a head start — family and rest come first',
      tasks: [
        { task: 'Optional: glance at Shape — who are your top 3 calls for Tuesday?', tip: 'Skip entirely if you need a true day off — that counts as winning too.' },
        { task: 'Optional: one casual personal post idea for next week (hobby, family, community — not a pitch)', tip: 'Save the idea; post Monday if it still feels right.' }
      ]
    },
    Sunday: {
      time: 'Optional — 10 min PM',
      focus: 'Week preview (optional)',
      why: 'Gentle Monday setup without sacrificing Sunday',
      tasks: [
        { task: 'Optional: write your one-sentence focus for the week ahead', tip: 'Takes 2 minutes. Or enjoy the full day off — plans can start Monday morning.' },
        { task: 'Optional: lay out coffee + calendar for Tuesday phone block', tip: 'Physical prep only — no calls, no outreach on Sunday.' }
      ]
    }
  };

  function sanitizeWeekendDays(days) {
    if (!Array.isArray(days)) return days;
    return days.map(day => {
      if (!WEEKEND_DAYS.includes(day.day)) return day;
      const blocks = day.blocks || [];
      const hasHeavy = blocks.some(b =>
        (b.tasks || []).some(t => HEAVY_WORK_RE.test((t.task || '') + ' ' + (b.focus || '')))
      );
      if (!hasHeavy && blocks.length <= 1) return day;
      const template = LIGHT_WEEKEND_BLOCKS[day.day];
      return {
        ...day,
        blocks: template ? [{ ...template }] : []
      };
    });
  }

  window.COACH_WEEKEND_RULES = PROMPT_BLOCK;
  window.COACH_WEEKEND_SOCIAL_NOTE = SOCIAL_CALENDAR_NOTE;
  window.getWeekendPlanRules = function () { return PROMPT_BLOCK; };
  window.getWeekendSocialRules = function () { return SOCIAL_CALENDAR_NOTE; };
  window.sanitizeWeekendDays = sanitizeWeekendDays;
})();