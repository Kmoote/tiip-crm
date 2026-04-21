// TIIP/SAIL CRM — BCC Gmail Sync
// Setup steps:
//   1. Go to script.google.com → New project (while signed in as TIIPbizdev@gmail.com)
//   2. Paste this entire file, save
//   3. Run syncBccEmails() once manually to grant Gmail permissions
//   4. Add a time trigger: Triggers → Add Trigger → syncBccEmails → Time-driven → Minutes timer → Every 10 minutes

const SUPABASE_URL = "https://vdaqbwbsnkrlkqbjllfa.supabase.co";
const SUPABASE_KEY = "sb_publishable_eL3-4rwKB6FqEFqron4jvw_gP5PlrcO";

function syncBccEmails() {
  const props = PropertiesService.getScriptProperties();
  const lastRun = props.getProperty("lastRunTime") || "2026-01-01";

  // Search for emails received since last run
  const query = `after:${lastRun.split("T")[0]}`;
  const threads = GmailApp.search(query, 0, 50);

  const emails = [];
  const lastRunDate = new Date(lastRun);

  threads.forEach(function(thread) {
    thread.getMessages().forEach(function(msg) {
      if (msg.getDate() <= lastRunDate) return;

      const fromRaw = msg.getFrom();
      const nameMatch = fromRaw.match(/^"?([^"<]+?)"?\s*</);
      const emailMatch = fromRaw.match(/<([^>]+)>/);
      const senderName = nameMatch ? nameMatch[1].trim() : fromRaw;
      const senderEmail = emailMatch ? emailMatch[1] : fromRaw;

      const body = msg.getPlainBody() || "";

      emails.push({
        id: "bcc_" + msg.getId(),
        gmail_message_id: msg.getId(),
        sender_name: senderName,
        sender_email: senderEmail,
        subject: msg.getSubject() || "(no subject)",
        body_snippet: body.substring(0, 600),
        body: body,
        received_at: msg.getDate().toISOString(),
        reviewed: false
      });
    });
  });

  if (emails.length > 0) {
    var options = {
      method: "post",
      contentType: "application/json",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": "Bearer " + SUPABASE_KEY,
        "Prefer": "resolution=ignore-duplicates"
      },
      payload: JSON.stringify(emails),
      muteHttpExceptions: true
    };
    var response = UrlFetchApp.fetch(SUPABASE_URL + "/rest/v1/bcc_emails", options);
    Logger.log("Synced " + emails.length + " emails. Response: " + response.getResponseCode());
  } else {
    Logger.log("No new emails since " + lastRun);
  }

  props.setProperty("lastRunTime", new Date().toISOString());
}
