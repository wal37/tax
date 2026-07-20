const currencyFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0
});

const refs = {
  taxForm: document.querySelector("#taxForm"),
  taxpayerType: document.querySelector("#taxpayerType"),
  grossIncome: document.querySelector("#grossIncome"),
  expenses: document.querySelector("#expenses"),
  reliefs: document.querySelector("#reliefs"),
  credits: document.querySelector("#credits"),
  state: document.querySelector("#state"),
  taxDue: document.querySelector("#taxDue"),
  taxSummary: document.querySelector("#taxSummary"),
  contactForm: document.querySelector("#contactForm"),
  leadName: document.querySelector("#leadName"),
  leadEmail: document.querySelector("#leadEmail"),
  leadType: document.querySelector("#leadType"),
  leadLocation: document.querySelector("#leadLocation"),
  leadMessage: document.querySelector("#leadMessage"),
  formStatus: document.querySelector("#formStatus")
};

function toNumber(input) {
  return Math.max(0, Number(input.value || 0));
}

function estimateIndividualTax(taxableIncome) {
  const bands = [
    { limit: 300000, rate: 0.07 },
    { limit: 300000, rate: 0.11 },
    { limit: 500000, rate: 0.15 },
    { limit: 500000, rate: 0.19 },
    { limit: 1600000, rate: 0.21 },
    { limit: Infinity, rate: 0.24 }
  ];

  let remaining = taxableIncome;
  let estimate = 0;

  for (const band of bands) {
    if (remaining <= 0) break;
    const amount = Math.min(remaining, band.limit);
    estimate += amount * band.rate;
    remaining -= amount;
  }

  return estimate;
}

function estimateTax() {
  const type = refs.taxpayerType.value;
  const income = toNumber(refs.grossIncome);
  const expenses = toNumber(refs.expenses);
  const reliefs = toNumber(refs.reliefs);
  const credits = toNumber(refs.credits);
  const taxableBase = Math.max(0, income - expenses - reliefs);

  let grossEstimate = 0;
  let label = "personal income planning bands";

  if (type === "sme") {
    grossEstimate = taxableBase * 0.2;
    label = "SME planning reserve";
  } else if (type === "freelancer") {
    grossEstimate = estimateIndividualTax(taxableBase) + taxableBase * 0.015;
    label = "freelance tax planning reserve";
  } else {
    grossEstimate = estimateIndividualTax(taxableBase);
  }

  const due = Math.max(0, Math.round(grossEstimate - credits));
  const effectiveRate = income ? Math.round((due / income) * 1000) / 10 : 0;

  refs.taxDue.textContent = currencyFormatter.format(due);
  refs.taxSummary.textContent = `${label} for ${refs.state.value}. Taxable base: ${currencyFormatter.format(
    taxableBase
  )}. Estimated effective reserve: ${effectiveRate}%. This is a planning demo, not official tax advice.`;
}

function saveLead(lead) {
  try {
    const savedLeads = JSON.parse(localStorage.getItem("mytaxdueLeads") || "[]");
    savedLeads.push(lead);
    localStorage.setItem("mytaxdueLeads", JSON.stringify(savedLeads));
  } catch (error) {
    console.warn("Could not save mytaxdue lead locally.", error);
  }
}

function handleLeadSubmit(event) {
  event.preventDefault();

  if (!refs.contactForm.checkValidity()) {
    refs.contactForm.reportValidity();
    return;
  }

  const lead = {
    name: refs.leadName.value.trim(),
    email: refs.leadEmail.value.trim(),
    type: refs.leadType.value,
    location: refs.leadLocation.value.trim(),
    message: refs.leadMessage.value.trim(),
    submittedAt: new Date().toISOString()
  };

  saveLead(lead);

  const subject = encodeURIComponent(`mytaxdue beta request from ${lead.name}`);
  const body = encodeURIComponent(
    [
      `Name: ${lead.name}`,
      `Email: ${lead.email}`,
      `User type: ${lead.type}`,
      `Location: ${lead.location}`,
      "",
      "Tax support needed:",
      lead.message
    ].join("\n")
  );

  refs.formStatus.textContent = "Request saved. Opening an email draft now.";
  window.location.href = `mailto:hello@mytaxdue.com?subject=${subject}&body=${body}`;
  refs.contactForm.reset();
}

refs.taxForm.addEventListener("submit", (event) => {
  event.preventDefault();
  estimateTax();
});

[refs.taxpayerType, refs.grossIncome, refs.expenses, refs.reliefs, refs.credits, refs.state].forEach((field) => {
  field.addEventListener("input", estimateTax);
  field.addEventListener("change", estimateTax);
});

refs.contactForm.addEventListener("submit", handleLeadSubmit);

estimateTax();
