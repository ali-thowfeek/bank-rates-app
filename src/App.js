import React, { useCallback, useEffect, useState } from "react";
import "./App.css";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import axios from "axios";
import Select from "react-select";
import "chartjs-plugin-datalabels";
import ChartDataLabels from "chartjs-plugin-datalabels";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

axios.defaults.headers.post["Content-Type"] = "application/json;charset=utf-8";

export const options = {
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "bottom",
    },
    datalabels: {
      color: "white",
      backgroundColor: "black",
      borderRadius: 10,
      padding: 5,
      display: function (context) {
        return context.dataIndex === context.dataset.data.length - 1;
      },
      labels: {
        title: {
          font: {
            weight: "bold",
          },
        },
        value: {
          color: "green",
        },
      },
    },
    title: {
      display: true,
      text: "Lanka Bank Buying Rates",
    },
  },
  layout: { padding: 30 },
};

const BASE_API_URL = window.configs.apiUrl;
const SELECTED_BANKS = "selectedBanks";
const SELECTED_CURRENCY = "selectedCurrency";

const months = Array.from({ length: 12 }, (_, index) => {
  const monthNumber = index + 1;
  const monthName = new Date(2022, index, 1).toLocaleString("en-US", {
    month: "long",
  });
  const monthId = `${monthNumber.toString().padStart(2, "0")}-01`;
  return { name: monthName, label: monthName, id: monthId };
});

const currentYear = new Date().getFullYear();

const years = Array.from({ length: currentYear - 2021 }, (_, index) => {
  const year = 2022 + index;
  return { label: year, id: year, name: year };
});

const App = () => {
  const [dataSet, setDataSet] = useState();
  const [banks, setBanks] = useState();
  const [currencies, setCurrencies] = useState();

  const [selectedBanks, setSelectedBanks] = useState([]);
  const [selectedCurrency, setSelectedCurrency] = useState();
  const [selectedMonth, setSelectedMonth] = useState(
    months[new Date().getMonth()]
  );

  const [selectedYear, setSelectedYear] = useState({
    name: currentYear,
    label: currentYear,
    id: String(currentYear),
  });

  const getData = useCallback(async () => {
    if (selectedBanks.length === 0 || !selectedCurrency.value) {
      return;
    }

    const response = await axios.post(`${BASE_API_URL}/rates`, {
      bankIds: selectedBanks.map((bank) => bank.value),
      currencyId: selectedCurrency.value,
      date: `${selectedYear.id || selectedYear.value}-${
        selectedMonth.id || selectedMonth.value
      }`,
    });

    const fullList = response.data;
    const uniqueData = {};
    const dates = {};
    for (let i = 0; i < fullList.length; i++) {
      const record = fullList[i];

      if (uniqueData[record.bank.name]) {
        uniqueData[record.bank.name] = [
          ...uniqueData[record.bank.name],
          record.rate,
        ];
      } else {
        uniqueData[record.bank.name] = [record.rate];
      }
      const recordDate = new Date(record.date).getDate();
      dates[recordDate] = recordDate;
    }

    const proccessed = [];

    for (const [key, value] of Object.entries(uniqueData)) {
      const color = Math.random().toString(16).substr(-6);
      proccessed.push({
        label: key,
        data: value,
        borderColor: `#${color}`,
        backgroundColor: `#${color}`,
      });
    }

    const final = {
      labels: Object.keys(dates),
      datasets: proccessed,
    };

    setDataSet(final);
  }, [selectedBanks, selectedCurrency, selectedYear, selectedMonth]);

  const getDefaultData = async () => {
    try {
      const banksResponse = await axios.get(`${BASE_API_URL}/banks`);
      const currenciesResponse = await axios.get(`${BASE_API_URL}/currencies`);
      setBanks(banksResponse.data);
      setCurrencies(currenciesResponse.data);

      const prevSelectedBanks = JSON.parse(
        localStorage.getItem(SELECTED_BANKS)
      );
      const prevSelectedCurrency = JSON.parse(
        localStorage.getItem(SELECTED_CURRENCY)
      );

      const defaultBank = banksResponse.data[0];
      const defaultCurrency = currenciesResponse.data[0];

      if (prevSelectedBanks || prevSelectedCurrency) {
        if (prevSelectedBanks) {
          setSelectedBanks(prevSelectedBanks);
        } else {
          setSelectedBanks([
            {
              value: defaultBank.id,
              label: defaultBank.name,
            },
          ]);
        }

        if (prevSelectedCurrency) {
          setSelectedCurrency(prevSelectedCurrency);
        } else {
          setSelectedCurrency({
            value: defaultCurrency.id,
            label: defaultCurrency.symbol,
          });
        }
      } else {
        setSelectedBanks([
          {
            value: defaultBank.id,
            label: defaultBank.name,
          },
        ]);
        setSelectedCurrency({
          value: defaultCurrency.id,
          label: defaultCurrency.symbol,
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  const setSelectedBanksHandler = (banks) => {
    localStorage.setItem(SELECTED_BANKS, JSON.stringify(banks));
    setSelectedBanks(banks);
  };

  const setSelectedCurrencyHandler = (currency) => {
    localStorage.setItem(SELECTED_CURRENCY, JSON.stringify(currency));
    setSelectedCurrency(currency);
  };

  useEffect(() => {
    getDefaultData();
  }, []);

  useEffect(() => {
    getData();
  }, [getData]);

  if (dataSet && banks && currencies) {
    return (
      <div id="main-container">
        <Dropdown
          label={"Select currency"}
          value={selectedCurrency}
          options={currencies}
          onChange={setSelectedCurrencyHandler}
        />

        <Dropdown
          label={"Select Bank(s)"}
          value={selectedBanks}
          options={banks}
          isMulti
          onChange={setSelectedBanksHandler}
        />

        <Dropdown
          label={"Month"}
          value={selectedMonth}
          options={months}
          onChange={setSelectedMonth}
        />
        <Dropdown
          label={"Year"}
          value={selectedYear}
          options={years}
          onChange={setSelectedYear}
        />
        <div id="canvas-container">
          <Line options={options} data={dataSet} />
        </div>
      </div>
    );
  }
  return <h1>Loading</h1>;
};

export default App;

const Dropdown = ({ label, value, options, onChange, isMulti }) => {
  const pOtions = options.map((i) => ({ value: i.id, label: i.name }));

  return (
    <div>
      {label}
      <Select
        onChange={onChange}
        options={pOtions}
        value={value}
        isMulti={isMulti}
      />
    </div>
  );
};
