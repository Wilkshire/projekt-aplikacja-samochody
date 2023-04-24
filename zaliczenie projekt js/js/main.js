let manager = {
  carData: {},
  availableOptions: {
    winterTires: {
      price: 3000,
      label: "Opony zimowe",
    },
    additionalInsurance: {
      price: 7500,
      label: "Dodatkowe ubezpieczenie",
    },
    bremboCalipers: {
      price: 2500,
      label: "Zaciski Brembo",
    },
  },

  prepareSelect: function () {
    const optionsToSelect = document.getElementById("optionsToSelect");
    const selectedOptions = document.getElementById("optionsSelected");

    for (const [key, value] of Object.entries(manager.availableOptions)) {
      let option = new Option(
        `${value.label} - ${manager.formatNumber(value.price)} PLN`,
        key
      );
      option.setAttribute("data-attr-price", value.price);
      if (
        typeof manager.carData.selectedConfig !== "undefined" &&
        manager.carData.selectedConfig.includes(key)
      ) {
        selectedOptions.append(option);
      } else {
        optionsToSelect.append(option);
      }
    }
  },

  saveCarData: function (event) {
    const elements = event.currentTarget.querySelectorAll("li");
    manager.carData["photo"] = event.currentTarget
      .querySelectorAll("img")[0]
      .getAttribute("src");
    manager.carData["carName"] =
      event.currentTarget.querySelectorAll(".card-title")[0].innerHTML;
    manager.carData["carName"] =
      event.currentTarget.querySelectorAll(".card-title")[0].innerHTML;

    elements.forEach(function (element) {
      let name = element.getAttribute("name");
      let value = element.getAttribute("data-attr-value");
      manager.carData[name] = value;
    });
    localStorage.setItem("carData", JSON.stringify(manager.carData));
    this.regenerateSummaryInfo();
  },

  showForm: function () {
    document.getElementById("checkoutForm").classList.remove("d-none");
    document.getElementById("list").classList.add("d-none");
    document.getElementById("summary").classList.add("d-none");
    localStorage.setItem("lastViewCallback", arguments.callee.name);
    manager.regenerateSummaryInfo();
  },

  regenerateSummaryInfo: function () {
    this.recalculatePrice();
    const price =
      typeof manager.carData.fullPrice === "undefined"
        ? manager.carData.price
        : manager.carData.fullPrice;
    document.getElementById(
      "selectedCar"
    ).innerHTML = `Wybrany samochód: ${manager.carData.carName}`;
    document.getElementById(
      "currentPrice"
    ).innerHTML = `Cena z konfiguracją: ${this.formatNumber(price)} PLN`;
  },

  showList: function () {
    document.getElementById("list").classList.remove("d-none");
    document.getElementById("checkoutForm").classList.add("d-none");
    document.getElementById("summary").classList.add("d-none");
    localStorage.setItem("lastViewCallback", arguments.callee.name);
  },

  showSummary: function () {
    this.prepareSummaryInfo();
    document.getElementById("summary").classList.remove("d-none");
    document.getElementById("list").classList.add("d-none");
    document.getElementById("checkoutForm").classList.add("d-none");
    localStorage.setItem("lastViewCallback", arguments.callee.name);
  },

  prepareSummaryInfo: function () {
    let element = document.getElementById("summaryImage");
    element.setAttribute("src", manager.carData.photo);

    let priceElement = document.getElementById("totalPrice");
    priceElement.innerHTML = `Cena całkowita: ${manager.formatNumber(
      manager.carData.fullPrice
    )} PLN`;

    let payementMethod = document.getElementById("payementMethod");
    payementMethod.innerHTML = `Metoda płatności: ${manager.carData.payementMethod}`;

    document.getElementById("checkout").reset();
  },

  addOptions: function () {
    const selectedValues =
      document.getElementById("optionsToSelect").selectedOptions;
    const selectedOptionsElement = document.getElementById("optionsSelected");

    Array.from(selectedValues).forEach(function (element) {
      selectedOptionsElement.append(element);
    });

    this.saveSelectedConfig();
  },

  saveSelectedConfig: function () {
    const selectedOptionsElement = document.getElementById("optionsSelected");
    let selectedConfig = [];
    Array.from(selectedOptionsElement.options, function (element) {
      selectedConfig.push(element.value);
    });

    this.carData.selectedConfig = selectedConfig;

    this.recalculatePrice();
    this.regenerateSummaryInfo();
  },

  removeOption: function () {
    const selectedValues =
      document.getElementById("optionsSelected").selectedOptions;
    const selectedOptionsElement = document.getElementById("optionsToSelect");

    Array.from(selectedValues).forEach(function (element) {
      selectedOptionsElement.append(element);
    });

    this.saveSelectedConfig();
  },

  validateForm: function () {
    let errors = document.getElementsByClassName("text-danger");
    if (errors.length) {
      document.getElementsByClassName("text-danger")[0].remove();
    }

    const form = document.forms["checkout"];
    const formData = new FormData(form);

    let payementOption = document.querySelectorAll(
      "input[name=payementOption]:checked"
    );
    payementOption = payementOption.length > 0 ? payementOption[0].value : "";
    formData.append("payementOption", payementOption);

    let errorContent = "";
    for (let input of formData.entries()) {
      if (input[0] === "clientName") {
        if (!input[1].match(/\b[A-Za-z]+\s[A-Za-z]+\b/g)) {
          errorContent +=
            'Pole "Imię i nazwisko" posiada nieprawidłową wartość.<br>';
        }
      }
      if (input[1] === "") {
        errorContent += "Wszystkie pola muszą być wypełnione.<br>";
        break;
      }
    }

    localStorage.setItem(
      "formData",
      JSON.stringify(Object.fromEntries(formData))
    );
    if (errorContent.length) {
      let errorSpan = document.createElement("span");
      errorSpan.className += "text-danger";
      errorSpan.innerHTML = errorContent;
      form.append(errorSpan);
    } else {
      manager.carData.payementMethod = document.querySelector(
        "input[name=payementOption]:checked"
      ).value;
      manager.showSummary();
      manager.carData = {};
      localStorage.clear();
    }
    return false;
  },

  recalculatePrice: function () {
    if (typeof this.carData.selectedConfig === "undefined") {
      this.carData.fullPrice = this.carData.price;
      return;
    }
    let additionalConfigPrice = 0;
    this.carData.selectedConfig.forEach(function (element) {
      additionalConfigPrice += parseInt(
        document
          .querySelectorAll(`option[value=${element}]`)[0]
          .getAttribute("data-attr-price")
      );
    });

    this.carData.fullPrice =
      additionalConfigPrice + parseInt(this.carData.price);

    localStorage.setItem("carData", JSON.stringify(manager.carData));
  },

  formatNumber: function (number) {
    return number.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1 ");
  },

  repopulateForm: function () {
    let formData = localStorage.getItem("formData");
    if (formData === null) {
      return;
    }

    formData = JSON.parse(formData);

    for (const [key, value] of Object.entries(formData)) {
      let input = document.querySelectorAll(`[name=${key}]`);
      if (input.length === 1) {
        input[0].value = value;
      } else if (value !== "") {
        document.querySelector(`[value=${value}]`).checked = true;
      }
    }
  },

  prepareDateSelect: function () {
    let element = document.querySelector("[name=pickupDate]");
    for (let i = 0; i < 14; i++) {
      let date = new Date();
      date.setDate(date.getDate() + i);
      let option = new Option(
        `${date.toJSON().slice(0, 10)}`,
        date.toJSON().slice(0, 10)
      );

      element.append(option);
    }
  },
};

document.addEventListener("DOMContentLoaded", function () {
  if (
    Object.keys(manager.carData).length === 0 &&
    localStorage.getItem("carData") !== null
  ) {
    manager.carData = JSON.parse(localStorage.getItem("carData"));
  }

  manager.prepareSelect();
  manager.prepareDateSelect();

  if (localStorage.getItem("lastViewCallback") !== null) {
    manager[localStorage.getItem("lastViewCallback")]();
  } else {
    manager.showList();
  }

  manager.repopulateForm();
  document
    .getElementById("checkoutForm")
    .addEventListener("change", function () {});

  document.querySelectorAll(".card").forEach(function (element) {
    element.addEventListener("click", function (event) {
      manager.saveCarData(event);
      manager.showForm();
    });
  });

  document.getElementById("addOption").addEventListener("click", function () {
    manager.addOptions();
  });

  document
    .getElementById("removeOption")
    .addEventListener("click", function () {
      manager.removeOption();
    });
});
