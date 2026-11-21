const productNameInput = document.getElementById("product-name");
const originalPriceInput = document.getElementById("original-price");
const customDiscountInput = document.getElementById("custom-discount");
const discountAmountOutput = document.getElementById("discount-amount");
const finalPriceOutput = document.getElementById("final-price");
const presetDiscountButtons = document.querySelectorAll(".calculator__discount-button");
const presetEditButton = document.getElementById("edit-presets");
const presetDialog = document.getElementById("preset-dialog");
const presetInputs = [
  document.getElementById("preset-value-1"),
  document.getElementById("preset-value-2"),
  document.getElementById("preset-value-3"),
  document.getElementById("preset-value-4")
];
const presetDialogMessage = document.getElementById("preset-dialog-message");
const savePresetChangesButton = document.getElementById("save-preset-changes");
const cancelPresetChangesButton = document.getElementById("cancel-preset-changes");
const restorePresetDefaultsButton = document.getElementById("restore-preset-defaults");
const clearCalculatorButton = document.getElementById("clear-calculator");
const saveToHistoryButton = document.getElementById("save-to-history");
const historyToggleButton = document.getElementById("history-toggle");
const historyPanel = document.getElementById("history-panel");
const historyCloseButton = document.getElementById("history-close");
const historyBackdrop = document.getElementById("history-backdrop");
const historyList = document.getElementById("history-list");
const historyExportButton = document.getElementById("export-history-pdf");
const historyExportStatus = document.getElementById("history-export-status");
const clearHistoryButton = document.getElementById("clear-history");
const historyConfirmDialog = document.getElementById("history-confirm-dialog");
const historyConfirmCancelButton = document.getElementById("cancel-clear-history");
const historyConfirmButton = document.getElementById("confirm-clear-history");
const historyConfirmError = document.getElementById("history-confirm-error");
const historyNotification = document.getElementById("history-notification");
const historyStorageKey = "discountCalculatorHistory";
const presetStorageKey = "discountCalculatorPresets";
const reportFontUrl = "assets/vendor/Roboto-Variable.ttf";
const defaultPresetValues = [5, 10, 15, 20];

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});
const historyDateFormatter = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short"
});
const reportDateTimeFormatter = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "long",
  timeStyle: "short"
});
const reportNumberFormatter = new Intl.NumberFormat("en-PH", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

let selectedPresetIndex = null;
let configuredPresetValues = [...defaultPresetValues];
let presetStorageWarning = "";
let historyRecords = [];
let notificationTimeoutId = null;
let reportFontBase64Promise = null;

function setInputError(input, message) {
  input.setCustomValidity(message);

  if (message) {
    input.setAttribute("aria-invalid", "true");
    input.title = message;
  } else {
    input.removeAttribute("aria-invalid");
    input.removeAttribute("title");
  }
}

function validateNumericInput(input, { minimum, maximum, label }) {
  const rawValue = input.value.trim();

  if (input.validity.badInput) {
    const message = `Enter a valid ${label.toLowerCase()}.`;
    setInputError(input, message);
    return { valid: false, value: null };
  }

  if (rawValue === "") {
    setInputError(input, "");
    return { valid: true, value: null };
  }

  const value = Number(rawValue);

  if (!Number.isFinite(value)) {
    const message = `Enter a valid ${label.toLowerCase()}.`;
    setInputError(input, message);
    return { valid: false, value: null };
  }

  if (value < minimum) {
    const message = `${label} cannot be less than ${minimum}.`;
    setInputError(input, message);
    return { valid: false, value: null };
  }

  if (value > maximum) {
    const message = `${label} cannot be greater than ${maximum}.`;
    setInputError(input, message);
    return { valid: false, value: null };
  }

  if (input.validity.stepMismatch) {
    const message = `${label} can have up to two decimal places.`;
    setInputError(input, message);
    return { valid: false, value: null };
  }

  setInputError(input, "");
  return { valid: true, value };
}

function updatePresetButtonStates() {
  presetDiscountButtons.forEach((button, index) => {
    const isSelected = index === selectedPresetIndex;
    button.classList.toggle("is-active", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });
}

function isValidPresetValues(values) {
  return Array.isArray(values) &&
    values.length === presetDiscountButtons.length &&
    values.every((value) =>
      Number.isFinite(value) && value > 0 && value <= 100
    );
}

function loadPresetValues() {
  try {
    const storedValues = window.localStorage.getItem(presetStorageKey);
    if (storedValues === null) {
      return [...defaultPresetValues];
    }

    const parsedValues = JSON.parse(storedValues);
    if (isValidPresetValues(parsedValues)) {
      return parsedValues;
    }

    console.warn("Saved discount presets are invalid; using defaults.");
    presetStorageWarning = "Saved presets were invalid, so the defaults are shown.";
  } catch (error) {
    console.warn("Saved discount presets could not be loaded; using defaults.", error);
    presetStorageWarning = "Saved presets could not be loaded, so the defaults are shown.";
  }

  return [...defaultPresetValues];
}

function clearPresetDialogFeedback() {
  presetInputs.forEach((input) => {
    input.setCustomValidity("");
    input.removeAttribute("aria-invalid");
  });
  presetDialogMessage.textContent = "";
  presetDialogMessage.classList.remove("is-error");
  presetDialogMessage.hidden = true;
}

function showPresetDialogMessage(message, isError = false) {
  presetDialogMessage.textContent = message;
  presetDialogMessage.classList.toggle("is-error", isError);
  presetDialogMessage.hidden = false;
}

function populatePresetInputs(values) {
  clearPresetDialogFeedback();
  presetInputs.forEach((input, index) => {
    input.value = String(values[index]);
  });
}

function applyPresetValues(values) {
  configuredPresetValues = [...values];
  presetDiscountButtons.forEach((button, index) => {
    button.dataset.discount = String(configuredPresetValues[index]);
    button.textContent = `${configuredPresetValues[index]}%`;
  });
  updatePresetButtonStates();

  if (selectedPresetIndex !== null) {
    calculateAndDisplay();
  }
}

function validatePresetInputs() {
  const values = [];
  let firstInvalidInput = null;

  presetInputs.forEach((input) => {
    const rawValue = input.value.trim();
    let message = "";
    let value = Number(rawValue);

    if (input.validity.badInput || rawValue === "" || !Number.isFinite(value)) {
      message = "Enter a valid percentage.";
    } else if (value <= 0) {
      message = "Percentage must be greater than 0.";
    } else if (value > 100) {
      message = "Percentage cannot exceed 100.";
    }

    input.setCustomValidity(message);
    if (message) {
      input.setAttribute("aria-invalid", "true");
      if (!firstInvalidInput) {
        firstInvalidInput = input;
      }
    } else {
      input.removeAttribute("aria-invalid");
      values.push(value);
    }
  });

  if (firstInvalidInput) {
    showPresetDialogMessage(
      "All four presets must be greater than 0 and no greater than 100.",
      true
    );
    firstInvalidInput.focus();
    return null;
  }

  clearPresetDialogFeedback();
  return values;
}

function savePresetValues(values) {
  try {
    window.localStorage.setItem(presetStorageKey, JSON.stringify(values));
    return true;
  } catch (error) {
    console.error("Discount presets could not be saved to local storage.", error);
    showPresetDialogMessage("Presets could not be saved. Check your browser storage settings.", true);
    return false;
  }
}

function openPresetDialog() {
  populatePresetInputs(configuredPresetValues);
  if (presetStorageWarning) {
    showPresetDialogMessage(presetStorageWarning, true);
  }
  presetDialog.showModal();
  presetEditButton.setAttribute("aria-expanded", "true");
}

function savePresetChanges() {
  const values = validatePresetInputs();
  if (!values || !savePresetValues(values)) {
    return;
  }

  presetStorageWarning = "";
  applyPresetValues(values);
  presetDialog.close();
}

function restorePresetDefaults() {
  if (!window.confirm("Restore the default preset values?")) {
    return;
  }

  const defaults = [...defaultPresetValues];
  if (!savePresetValues(defaults)) {
    return;
  }

  presetStorageWarning = "";
  applyPresetValues(defaults);
  presetDialog.close();
}

function resetResults() {
  discountAmountOutput.textContent = "₱0.00";
  finalPriceOutput.textContent = "₱0.00";
}

function calculateAndDisplay() {
  const priceResult = validateNumericInput(originalPriceInput, {
    minimum: 0,
    maximum: Number.MAX_VALUE,
    label: "Original price"
  });
  const customDiscountResult = validateNumericInput(customDiscountInput, {
    minimum: 0,
    maximum: 100,
    label: "Discount percentage"
  });

  if (!priceResult.valid || !customDiscountResult.valid || priceResult.value === null) {
    resetResults();
    return null;
  }

  const discountPercentage = selectedPresetIndex !== null
    ? Number(presetDiscountButtons[selectedPresetIndex].dataset.discount)
    : customDiscountResult.value ?? 0;
  const discountAmount = priceResult.value * (discountPercentage / 100);
  const finalPrice = priceResult.value - discountAmount;

  if (!Number.isFinite(discountAmount) || !Number.isFinite(finalPrice)) {
    setInputError(originalPriceInput, "Enter a smaller price.");
    resetResults();
    return null;
  }

  discountAmountOutput.textContent = currencyFormatter.format(discountAmount);
  finalPriceOutput.textContent = currencyFormatter.format(finalPrice);
  return {
    originalPrice: priceResult.value,
    discountPercentage,
    discountAmount,
    finalPrice
  };
}

function selectPresetDiscount(button) {
  selectedPresetIndex = Array.from(presetDiscountButtons).indexOf(button);
  customDiscountInput.value = "";
  setInputError(customDiscountInput, "");
  updatePresetButtonStates();
  calculateAndDisplay();
}

function handleCustomDiscountInput() {
  selectedPresetIndex = null;
  updatePresetButtonStates();
  calculateAndDisplay();
}

function handleInputBlur(input, validationOptions) {
  const result = validateNumericInput(input, validationOptions);
  if (!result.valid) {
    input.reportValidity();
  }
}

function clearCalculator() {
  productNameInput.value = "";
  originalPriceInput.value = "";
  customDiscountInput.value = "";
  selectedPresetIndex = null;
  setInputError(productNameInput, "");
  setInputError(originalPriceInput, "");
  setInputError(customDiscountInput, "");
  updatePresetButtonStates();
  resetResults();
}

function showHistoryNotification(message, isError = false) {
  historyNotification.textContent = message;
  historyNotification.classList.toggle("is-error", isError);
  historyNotification.hidden = false;

  window.clearTimeout(notificationTimeoutId);
  notificationTimeoutId = window.setTimeout(() => {
    historyNotification.hidden = true;
  }, 3500);
}

function isValidHistoryRecord(record) {
  return Boolean(
    record &&
    typeof record.id === "string" &&
    record.id.length > 0 &&
    (record.productName === undefined || typeof record.productName === "string") &&
    Number.isFinite(record.originalPrice) &&
    record.originalPrice >= 0 &&
    Number.isFinite(record.discountPercentage) &&
    record.discountPercentage > 0 &&
    record.discountPercentage <= 100 &&
    Number.isFinite(record.discountAmount) &&
    record.discountAmount >= 0 &&
    Number.isFinite(record.finalPrice) &&
    record.finalPrice >= 0 &&
    typeof record.timestamp === "string" &&
    Number.isFinite(Date.parse(record.timestamp))
  );
}

function parseHistoryRecords(serializedRecords) {
  if (serializedRecords === null) {
    return [];
  }

  let parsedRecords;
  try {
    parsedRecords = JSON.parse(serializedRecords);
  } catch (error) {
    console.warn("Saved discount history could not be parsed.", error);
    showHistoryNotification("Saved history data is invalid and could not be loaded.", true);
    return [];
  }

  if (!Array.isArray(parsedRecords)) {
    console.warn("Saved discount history is not a list.");
    showHistoryNotification("Saved history data is invalid and could not be loaded.", true);
    return [];
  }

  const validRecords = parsedRecords.filter(isValidHistoryRecord);
  if (validRecords.length !== parsedRecords.length) {
    console.warn("Some invalid discount history records were skipped.");
    showHistoryNotification("Some invalid history records were skipped.", true);
  }

  return validRecords.sort((first, second) =>
    Date.parse(second.timestamp) - Date.parse(first.timestamp)
  );
}

function getHistoryProductName(record) {
  const productName = typeof record.productName === "string" ? record.productName.trim() : "";
  return productName || "Unnamed Product";
}

function setHistoryExportStatus(message, isError = false) {
  historyExportStatus.textContent = message;
  historyExportStatus.classList.toggle("is-error", isError);
  historyExportStatus.hidden = !message;
}

function readHistoryRecordsForExport() {
  try {
    const serializedRecords = window.localStorage.getItem(historyStorageKey);
    if (serializedRecords === null) {
      return [];
    }

    const records = JSON.parse(serializedRecords);
    if (!Array.isArray(records) || records.some((record) => !isValidHistoryRecord(record))) {
      throw new Error("Saved history contains invalid records.");
    }

    return records.slice().sort((first, second) =>
      Date.parse(second.timestamp) - Date.parse(first.timestamp)
    );
  } catch (error) {
    console.error("Discount history could not be read for PDF export.", error);
    setHistoryExportStatus("Saved history could not be read or contains invalid data. No report was generated.", true);
    return null;
  }
}

async function loadReportLogo() {
  const logo = document.querySelector(".calculator__logo");
  const response = await fetch(logo.src);
  if (!response.ok) {
    throw new Error(`The business logo could not be loaded (${response.status}).`);
  }

  const logoBlob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("The business logo could not be converted for the PDF."));
      }
    });
    reader.addEventListener("error", () => {
      reject(reader.error || new Error("The business logo could not be read."));
    });
    reader.readAsDataURL(logoBlob);
  }).then(createCircularLogoDataUrl);
}

async function createCircularLogoDataUrl(imageDataUrl) {
  const image = new Image();
  await new Promise((resolve, reject) => {
    image.addEventListener("load", resolve, { once: true });
    image.addEventListener("error", () => {
      reject(new Error("The business logo could not be prepared for the PDF."));
    }, { once: true });
    image.src = imageDataUrl;
  });

  const size = Math.min(image.naturalWidth, image.naturalHeight);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("A canvas could not be created for the business logo.");
  }

  context.beginPath();
  context.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  context.clip();
  context.drawImage(
    image,
    (image.naturalWidth - size) / 2,
    (image.naturalHeight - size) / 2,
    size,
    size,
    0,
    0,
    size,
    size
  );
  return canvas.toDataURL("image/png");
}

async function loadReportFont() {
  if (!reportFontBase64Promise) {
    reportFontBase64Promise = (async () => {
      const response = await fetch(reportFontUrl);
      if (!response.ok) {
        throw new Error(`The PDF font could not be loaded (${response.status}).`);
      }

      const bytes = new Uint8Array(await response.arrayBuffer());
      let binary = "";
      const chunkSize = 0x8000;
      for (let offset = 0; offset < bytes.length; offset += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
      }
      return window.btoa(binary);
    })().catch((error) => {
      reportFontBase64Promise = null;
      throw error;
    });
  }

  return reportFontBase64Promise;
}

function formatReportPeso(value) {
  return `₱ ${reportNumberFormatter.format(value)}`;
}

function isAppleMobileDevice() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function drawReportSummary(pdf, totals, left, top, width) {
  const colors = {
    cream: [248, 244, 234],
    champagne: [230, 213, 184],
    warmSand: [216, 193, 155],
    caramel: [185, 149, 99],
    darkBrown: [74, 56, 40],
    white: [255, 255, 255]
  };
  const headerHeight = 8;
  const cardY = top + headerHeight + 3;
  const cardHeight = 25;
  const gap = 3;
  const cardWidth = (width - gap * 3) / 4;
  const cards = [
    { label: "Transactions", value: String(totals.count), valueColor: colors.darkBrown },
    { label: "Total Original Value", value: formatReportPeso(totals.original), valueColor: colors.darkBrown },
    { label: "Total Savings", value: formatReportPeso(totals.savings), valueColor: colors.caramel },
    { label: "Total Final Value", value: formatReportPeso(totals.final), valueColor: colors.darkBrown }
  ];

  pdf.setFillColor(...colors.champagne);
  pdf.roundedRect(left, top, width, headerHeight, 2, 2, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(...colors.darkBrown);
  pdf.text("REPORT SUMMARY", left + 3, top + 5.4);

  cards.forEach((card, index) => {
    const cardX = left + index * (cardWidth + gap);
    pdf.setFillColor(...(index % 2 === 0 ? colors.cream : colors.white));
    pdf.setDrawColor(...colors.warmSand);
    pdf.setLineWidth(0.25);
    pdf.roundedRect(cardX, cardY, cardWidth, cardHeight, 2, 2, "FD");
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(...colors.darkBrown);
    pdf.text(card.label, cardX + cardWidth / 2, cardY + 7, { align: "center" });
    pdf.setFont("Roboto", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(...card.valueColor);
    pdf.text(card.value, cardX + cardWidth / 2, cardY + 16, {
      align: "center",
      maxWidth: cardWidth - 4
    });
  });

  return cardY + cardHeight;
}

async function createHistoryPdf(records, pdfWindow) {
  const jsPdfNamespace = window.jspdf;
  if (
    !jsPdfNamespace ||
    typeof jsPdfNamespace.jsPDF !== "function" ||
    typeof jsPdfNamespace.jsPDF.API.autoTable !== "function"
  ) {
    throw new Error("The PDF library is unavailable.");
  }

  const [logoDataUrl, reportFontBase64] = await Promise.all([
    loadReportLogo(),
    loadReportFont()
  ]);
  const pdf = new jsPdfNamespace.jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });
  pdf.addFileToVFS("Roboto.ttf", reportFontBase64);
  pdf.addFont("Roboto.ttf", "Roboto", "normal");
  pdf.addFont("Roboto.ttf", "Roboto", "bold");
  const colors = {
    cream: [248, 244, 234],
    champagne: [230, 213, 184],
    warmSand: [216, 193, 155],
    caramel: [185, 149, 99],
    darkBrown: [74, 56, 40],
    mutedBrown: [116, 99, 78],
    divider: [226, 213, 190]
  };
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const logoSize = 39;
  const generatedAt = new Date();
  const dateSuffix = [
    generatedAt.getFullYear(),
    String(generatedAt.getMonth() + 1).padStart(2, "0"),
    String(generatedAt.getDate()).padStart(2, "0")
  ].join("-");
  const filename = `Anything_Under_The_Sun_Discount_History_${dateSuffix}.pdf`;
  const totalPagesExpression = "{total_pages_count_string}";
  const totalCents = (key) => records.reduce((sum, record) => {
    const recordCents = Math.round((record[key] + Number.EPSILON) * 100);
    const runningTotal = sum + recordCents;
    if (!Number.isSafeInteger(recordCents) || !Number.isSafeInteger(runningTotal)) {
      throw new RangeError("History totals exceed the precision supported by the report.");
    }
    return runningTotal;
  }, 0);
  const totals = {
    count: records.length,
    original: totalCents("originalPrice") / 100,
    savings: totalCents("discountAmount") / 100,
    final: totalCents("finalPrice") / 100
  };

  pdf.setFillColor(...colors.cream);
  pdf.rect(0, 0, pageWidth, 53, "F");
  pdf.addImage(logoDataUrl, "PNG", margin, 8, logoSize, logoSize);
  pdf.setDrawColor(...colors.warmSand);
  pdf.setLineWidth(0.5);
  pdf.circle(margin + logoSize / 2, 8 + logoSize / 2, logoSize / 2);
  pdf.setTextColor(...colors.darkBrown);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(15);
  pdf.text("ANYTHING UNDER THE SUN", 57, 17);
  pdf.setFontSize(17);
  pdf.text("DISCOUNT HISTORY REPORT", 57, 28);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(...colors.mutedBrown);
  pdf.text("Official Record of Discount Calculations", 57, 35);
  pdf.setFontSize(8);
  pdf.text(`Generated: ${reportDateTimeFormatter.format(generatedAt)}`, 57, 43);
  pdf.setDrawColor(...colors.warmSand);
  pdf.setLineWidth(0.4);
  pdf.line(margin, 52, pageWidth - margin, 52);

  const summaryBottom = drawReportSummary(pdf, totals, margin, 58, contentWidth);
  const tableTitleY = summaryBottom + 12;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(...colors.darkBrown);
  pdf.text("TRANSACTION HISTORY", margin, tableTitleY);

  const tableRows = records.map((record, index) => [
    String(index + 1),
    getHistoryProductName(record),
    historyDateFormatter.format(new Date(record.timestamp)),
    formatReportPeso(record.originalPrice),
    `${record.discountPercentage}%`,
    formatReportPeso(record.discountAmount),
    formatReportPeso(record.finalPrice)
  ]);

  pdf.autoTable({
    startY: tableTitleY + 4,
    margin: { top: 14, right: margin, bottom: 19, left: margin },
    head: [[
      "Transaction Number",
      "Product Name",
      "Date & Time",
      "Original Price",
      "Discount Percentage",
      "Discount Amount",
      "Final Price"
    ]],
    body: tableRows,
    theme: "grid",
    showHead: "everyPage",
    rowPageBreak: "avoid",
    styles: {
      font: "Roboto",
      fontSize: 6.5,
      cellPadding: 2.2,
      minCellHeight: 7,
      lineColor: colors.divider,
      lineWidth: 0.15,
      textColor: colors.darkBrown,
      overflow: "linebreak"
    },
    headStyles: {
      fillColor: colors.champagne,
      textColor: colors.darkBrown,
      fontStyle: "bold",
      fontSize: 6.5
    },
    alternateRowStyles: { fillColor: colors.cream },
    columnStyles: {
      0: { cellWidth: 19, halign: "center" },
      1: { cellWidth: 35 },
      2: { cellWidth: 29 },
      3: { cellWidth: 26, halign: "right", fontStyle: "bold" },
      4: { cellWidth: 25, halign: "right" },
      5: { cellWidth: 26, halign: "right", fontStyle: "bold", textColor: colors.caramel },
      6: { cellWidth: 22, halign: "right", fontStyle: "bold" }
    },
    didDrawPage: () => {
      pdf.setDrawColor(...colors.divider);
      pdf.setLineWidth(0.25);
      pdf.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      pdf.setTextColor(...colors.mutedBrown);
      pdf.text("Anything Under The Sun", margin, pageHeight - 8);
      pdf.text("Discount History Report", pageWidth / 2, pageHeight - 8, { align: "center" });
      pdf.text(
        `Page ${pdf.internal.getNumberOfPages()} of ${totalPagesExpression}`,
        pageWidth - margin,
        pageHeight - 8,
        { align: "right" }
      );
    }
  });

  pdf.putTotalPages(totalPagesExpression);
  if (pdfWindow) {
    const pdfUrl = URL.createObjectURL(pdf.output("blob"));
    pdfWindow.location.replace(pdfUrl);
    window.setTimeout(() => URL.revokeObjectURL(pdfUrl), 300000);
    return;
  }

  pdf.save(filename);
}

async function exportHistoryAsPdf() {
  setHistoryExportStatus("");
  const records = readHistoryRecordsForExport();
  if (records === null) {
    return;
  }
  if (records.length === 0) {
    setHistoryExportStatus("There is no discount history to export.");
    return;
  }

  let pdfWindow = null;
  if (isAppleMobileDevice()) {
    pdfWindow = window.open("about:blank", "_blank");
    if (!pdfWindow) {
      setHistoryExportStatus("Allow pop-ups to open the PDF on this device.", true);
      return;
    }
  }

  historyExportButton.disabled = true;
  const buttonLabel = historyExportButton.querySelector("span");
  const originalLabel = buttonLabel.textContent;
  buttonLabel.textContent = "Preparing PDF...";

  try {
    await createHistoryPdf(records, pdfWindow);
    setHistoryExportStatus(
      pdfWindow
        ? "PDF report opened in a new tab. Use Safari's sharing or save options."
        : "Discount history PDF exported successfully."
    );
  } catch (error) {
    console.error("Discount history PDF could not be generated.", error);
    if (pdfWindow && !pdfWindow.closed) {
      pdfWindow.close();
    }
    setHistoryExportStatus("The PDF could not be generated. Check your connection and try again.", true);
  } finally {
    historyExportButton.disabled = false;
    buttonLabel.textContent = originalLabel;
  }
}

function loadHistory() {
  try {
    historyRecords = parseHistoryRecords(window.localStorage.getItem(historyStorageKey));
  } catch (error) {
    console.error("Discount history could not be read from local storage.", error);
    historyRecords = [];
    showHistoryNotification("History is unavailable in this browser.", true);
  }

  renderHistory();
}

function persistHistory() {
  try {
    window.localStorage.setItem(historyStorageKey, JSON.stringify(historyRecords));
    return true;
  } catch (error) {
    console.error("Discount history could not be saved to local storage.", error);
    return false;
  }
}

function createHistoryTextElement(tagName, className, text) {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = text;
  return element;
}

function appendHistoryRow(card, label, value, valueClass = "") {
  const row = document.createElement("span");
  row.className = "history-card__row";
  row.append(
    createHistoryTextElement("span", "", label),
    createHistoryTextElement("span", valueClass, value)
  );
  card.append(row);
}

function createHistoryCard(record) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "history-card";
  card.dataset.historyId = record.id;

  const topline = document.createElement("span");
  topline.className = "history-card__topline";
  topline.append(
    createHistoryTextElement("span", "history-card__percentage", `${record.discountPercentage}% discount`),
    createHistoryTextElement("span", "history-card__date", historyDateFormatter.format(new Date(record.timestamp)))
  );

  const productName = createHistoryTextElement("span", "history-card__product-name", getHistoryProductName(record));
  appendHistoryRow(card, "Original Price", currencyFormatter.format(record.originalPrice));
  appendHistoryRow(card, "You Save", currencyFormatter.format(record.discountAmount), "history-card__saving");

  const finalRow = document.createElement("span");
  finalRow.className = "history-card__final";
  finalRow.append(
    createHistoryTextElement("span", "", "Final Price"),
    createHistoryTextElement("strong", "", currencyFormatter.format(record.finalPrice))
  );

  card.prepend(topline);
  card.prepend(productName);
  card.append(finalRow);
  return card;
}

function renderHistory() {
  historyList.replaceChildren();

  if (historyRecords.length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "history-empty";
    emptyState.append(
      createHistoryTextElement("span", "history-empty__icon", "◷"),
      createHistoryTextElement("p", "", "No discount history yet.")
    );
    emptyState.firstElementChild.setAttribute("aria-hidden", "true");
    historyList.append(emptyState);
    clearHistoryButton.disabled = true;
    return;
  }

  historyRecords.forEach((record) => {
    historyList.append(createHistoryCard(record));
  });
  clearHistoryButton.disabled = false;
}

function setHistoryPanelOpen(isOpen) {
  historyPanel.classList.toggle("is-open", isOpen);
  historyBackdrop.classList.toggle("is-visible", isOpen);
  historyPanel.setAttribute("aria-hidden", String(!isOpen));
  historyPanel.inert = !isOpen;
  historyToggleButton.setAttribute("aria-expanded", String(isOpen));
  document.body.classList.toggle("history-open", isOpen);

  if (isOpen) {
    historyCloseButton.focus();
  } else {
    historyToggleButton.focus();
  }
}

function saveCurrentCalculation() {
  const calculation = calculateAndDisplay();
  if (!calculation || calculation.discountPercentage <= 0) {
    showHistoryNotification("Enter a valid price and apply a discount before saving.", true);
    return;
  }

  const productName = productNameInput.value.trim();
  if (!productName) {
    setInputError(productNameInput, "Enter a product name before saving to history.");
    showHistoryNotification("Enter a product name before saving to history.", true);
    productNameInput.focus();
    return;
  }

  productNameInput.value = productName;
  setInputError(productNameInput, "");

  const record = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    ...calculation,
    productName,
    timestamp: new Date().toISOString()
  };
  historyRecords.unshift(record);

  if (!persistHistory()) {
    historyRecords.shift();
    showHistoryNotification("History could not be saved. Check your browser storage settings.", true);
    return;
  }

  renderHistory();
  showHistoryNotification("Calculation saved to history.");
}

function restoreHistoryRecord(recordId) {
  const record = historyRecords.find((item) => item.id === recordId);
  if (!record) {
    return;
  }

  productNameInput.value = typeof record.productName === "string" ? record.productName : "";
  setInputError(productNameInput, "");
  originalPriceInput.value = String(record.originalPrice);
  setInputError(originalPriceInput, "");

  const matchingPresetIndex = Array.from(presetDiscountButtons).findIndex(
    (button) => Number(button.dataset.discount) === record.discountPercentage
  );
  selectedPresetIndex = matchingPresetIndex >= 0 ? matchingPresetIndex : null;
  customDiscountInput.value = selectedPresetIndex !== null ? "" : String(record.discountPercentage);
  setInputError(customDiscountInput, "");
  updatePresetButtonStates();
  calculateAndDisplay();
  setHistoryPanelOpen(false);
}

function openClearHistoryDialog() {
  if (historyRecords.length === 0) {
    return;
  }

  historyConfirmError.textContent = "";
  historyConfirmError.hidden = true;
  historyConfirmDialog.showModal();
  historyConfirmCancelButton.focus();
}

function clearHistory() {
  try {
    window.localStorage.removeItem(historyStorageKey);
  } catch (error) {
    console.error("Discount history could not be cleared from local storage.", error);
    historyConfirmError.textContent = "History could not be cleared. Check your browser storage settings.";
    historyConfirmError.hidden = false;
    return;
  }

  historyRecords = [];
  renderHistory();
  historyConfirmDialog.close();
  showHistoryNotification("Discount history cleared.");
}

originalPriceInput.addEventListener("input", calculateAndDisplay);
productNameInput.addEventListener("input", () => setInputError(productNameInput, ""));
originalPriceInput.addEventListener("blur", () => {
  handleInputBlur(originalPriceInput, {
    minimum: 0,
    maximum: Number.MAX_VALUE,
    label: "Original price"
  });
});

customDiscountInput.addEventListener("input", handleCustomDiscountInput);
customDiscountInput.addEventListener("blur", () => {
  handleInputBlur(customDiscountInput, {
    minimum: 0,
    maximum: 100,
    label: "Discount percentage"
  });
});

presetDiscountButtons.forEach((button) => {
  button.setAttribute("aria-pressed", "false");
  button.addEventListener("click", () => selectPresetDiscount(button));
});

clearCalculatorButton.addEventListener("click", clearCalculator);
saveToHistoryButton.addEventListener("click", saveCurrentCalculation);
presetEditButton.addEventListener("click", openPresetDialog);
savePresetChangesButton.addEventListener("click", savePresetChanges);
cancelPresetChangesButton.addEventListener("click", () => presetDialog.close());
restorePresetDefaultsButton.addEventListener("click", restorePresetDefaults);
presetDialog.addEventListener("close", () => {
  presetEditButton.setAttribute("aria-expanded", "false");
  presetEditButton.focus();
});
historyToggleButton.addEventListener("click", () => {
  setHistoryPanelOpen(historyToggleButton.getAttribute("aria-expanded") !== "true");
});
historyCloseButton.addEventListener("click", () => setHistoryPanelOpen(false));
historyBackdrop.addEventListener("click", () => setHistoryPanelOpen(false));
clearHistoryButton.addEventListener("click", openClearHistoryDialog);
historyExportButton.addEventListener("click", exportHistoryAsPdf);
historyConfirmCancelButton.addEventListener("click", () => historyConfirmDialog.close());
historyConfirmButton.addEventListener("click", clearHistory);
historyConfirmDialog.addEventListener("click", (event) => {
  if (event.target !== historyConfirmDialog) {
    return;
  }

  const bounds = historyConfirmDialog.getBoundingClientRect();
  const clickedOutside =
    event.clientX < bounds.left ||
    event.clientX > bounds.right ||
    event.clientY < bounds.top ||
    event.clientY > bounds.bottom;

  if (clickedOutside) {
    historyConfirmDialog.close();
  }
});
historyConfirmDialog.addEventListener("close", () => {
  if (historyRecords.length > 0) {
    clearHistoryButton.focus();
  } else {
    historyCloseButton.focus();
  }
});

historyList.addEventListener("click", (event) => {
  const card = event.target.closest(".history-card");
  if (card && historyList.contains(card)) {
    restoreHistoryRecord(card.dataset.historyId);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") {
    return;
  }

  if (historyConfirmDialog.open) {
    event.preventDefault();
    historyConfirmDialog.close();
    return;
  }

  if (historyPanel.classList.contains("is-open")) {
    setHistoryPanelOpen(false);
  }
});

window.addEventListener("storage", (event) => {
  if (event.key === historyStorageKey || event.key === null) {
    historyRecords = parseHistoryRecords(event.key === null ? null : event.newValue);
    renderHistory();
  }
});

configuredPresetValues = loadPresetValues();
applyPresetValues(configuredPresetValues);
loadHistory();