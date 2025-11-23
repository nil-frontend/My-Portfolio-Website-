function createClientOnboardingForm() {

  var companyName = "NíL Studio"; // change to your brand

  var form = FormApp.create(companyName + " — Client Onboarding Form")
    .setIsQuiz(false)
    .setDescription("Thank you for your interest. Please complete this onboarding form. Estimated time: 3–5 minutes.");

  // SECTION 1 — Client Information
  form.addSectionHeaderItem().setTitle("SECTION 1 — Client Information");
  form.addTextItem().setTitle("Full Name").setRequired(true);
  form.addTextItem().setTitle("Email Address").setRequired(true);
  form.addTextItem().setTitle("Phone Number (WhatsApp preferred)").setRequired(true);
  form.addTextItem().setTitle("Company / Brand Name (if any)");
  form.addTextItem().setTitle("Website / Business Profile Link");

  // SECTION 2 — Service Requirements
  form.addSectionHeaderItem().setTitle("SECTION 2 — Service Requirements");

  var services = [
    "Web Development",
    "Software as a Service (SaaS)",
    "Consultancy",
    "Hacking",
    "Video Editing"
  ];

  var svcItem = form.addCheckboxItem();
  svcItem.setTitle("Which service(s) are you interested in?");
  svcItem.setChoiceValues(services.concat(["Other (please specify)"]));
  svcItem.setRequired(true);

  form.addParagraphTextItem().setTitle("Briefly describe what you want us to do for you").setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle("Project Timeline")
    .setChoiceValues(["Urgent (Within 48 hours)", "Within 7 days", "2–4 weeks", "1–3 months", "Flexible / Not sure"])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle("Approximate Budget")
    .setChoiceValues(["Below ₹10,000", "₹10,000 – ₹25,000", "₹25,000 – ₹50,000", "₹50,000 – ₹1,00,000", "Above ₹1,00,000", "Not decided"])
    .setRequired(true);

  // SECTION 3 — Business / Project Details
  form.addSectionHeaderItem().setTitle("SECTION 3 — Business / Project Details");
  form.addParagraphTextItem().setTitle("What is your business about? (briefly)").setRequired(true);
  form.addTextItem().setTitle("Target audience / customer base").setRequired(true);
  form.addParagraphTextItem().setTitle("Any references, inspiration links, or sample work you like? (paste links)");

  form.addCheckboxItem()
    .setTitle("Do you already have any assets?")
    .setChoiceValues(["Logo", "Brand Kit", "Content / Images", "Raw Videos", "Website Content (Text)", "Social Media Posts", "None, I need everything", "Other"]);

  // Optional File Upload (only works on Google Workspace)
  try {
    form.addFileUploadItem().setTitle("Upload reference files (Optional)");
  } catch (err) {
    Logger.log("File upload not supported on this account.");
  }

  // SECTION 4 — Communication
  form.addSectionHeaderItem().setTitle("SECTION 4 — Communication & Workflow");

  form.addMultipleChoiceItem()
    .setTitle("Preferred mode of communication")
    .setChoiceValues(["WhatsApp", "Email", "Phone Call", "Google Meet / Zoom"])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle("Best time to contact you")
    .setChoiceValues(["Morning", "Afternoon", "Evening", "Anytime"])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle("How soon should we contact you?")
    .setChoiceValues(["Within 24 hours", "1–2 days", "This week", "Flexible"])
    .setRequired(true);

  form.addParagraphTextItem().setTitle("Anything else you want us to know?");

  // SECTION 5 — Confirmation
  form.addSectionHeaderItem().setTitle("SECTION 5 — Confirmation");
  form.addMultipleChoiceItem()
    .setTitle("How did you hear about us?")
    .setChoiceValues(["Instagram", "YouTube", "Google Search", "Referral", "WhatsApp", "Other"])
    .setRequired(true);

  form.addCheckboxItem()
    .setTitle("Agreement")
    .setChoiceValues(["I confirm the information provided is accurate and I consent to be contacted."])
    .setRequired(true);

  form.setConfirmationMessage("Thank you for submitting! We will contact you shortly.");

  // Link to spreadsheet
  try {
    var ss = SpreadsheetApp.create(companyName + " — Form Responses");
    form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
    Logger.log("Spreadsheet created: " + ss.getUrl());
  } catch (e) {
    Logger.log("Failed to create spreadsheet: " + e);
  }

  Logger.log("Form created successfully: " + form.getEditUrl());
}
