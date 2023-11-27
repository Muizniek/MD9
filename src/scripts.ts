import axios from 'axios';

// Define the interface for a country
interface Country {
  name: string;
  code: string;
  capital: string;
  region: string;
  currency: {
    code: string;
    name: string;
    symbol: string;
  };
  language: {
    code: string;
    name: string;
  };
  flag: string; 
}

let countries: Country[] = []; // Array to store all countries
let currentIndex = 0; // Index to keep track of the loaded countries

// Function to fetch countries from the server
async function fetchCountries() {
  try {
    console.log('Fetching countries...');
    const response = await axios.get(`http://localhost:3004/countries?_sort=name&_order=asc&_start=${currentIndex}&_limit=20`);
    console.log('Received data:', response.data);
    countries = response.data;
    updateTable();
  } catch (error) {
    console.error('Error fetching countries:', error);
  }
}

// Define a mapped type for valid search options
type SearchOption = 'name' | 'code' | 'capital' | 'currency' | 'language';

// Function to search countries based on user input and selected option
(window as any).searchCountries = async function () {
  const searchInputs = document.querySelectorAll('.form-control');
  const searchParams: { [key: string]: string } = {};

  searchInputs.forEach((input: HTMLInputElement) => {
    const option = input.id.replace('Input', '');
    const searchTerm = input.value.trim().toLowerCase();

    if (searchTerm !== '') {
      // Special handling for currency to search regardless of what is in brackets
      if (option === 'currency') {
        searchParams['currency.name_like' || 'currency.symbol_like'] = searchTerm;
      } else if (option === 'language') {
        searchParams['language.name_like'] = searchTerm;
      } else {
        searchParams[`${option}_like`] = searchTerm;
      }
    }
  });

  try {
    const response = await axios.get(`http://localhost:3004/countries`, {
      params: {
        ...searchParams,
        _sort: 'name',
        _order: 'asc',
        _start: 0,
        _limit: 1080,
      },
    });

    const filteredCountries = response.data;
    currentIndex = 0; // Reset index when searching
    countries = filteredCountries;
    updateTable();
  } catch (error) {
    console.error('Error searching countries:', error);
  }
};

// Function to update the table with the current or filtered countries
function updateTable() {
  const tableBody = document.getElementById('countryTableBody');
  if (!tableBody || !countries || countries.length === 0) {
    console.error('Invalid data or tableBody not found');
    return;
  }

  tableBody.innerHTML = ''; // Clear existing data

  // Loop through the countries and append rows to the table
  for (let i = 0; i < currentIndex + 20 && i < countries.length; i++) {
    const country = countries[i];
    const row = `
      <tr>
        <td>${i + 1}</td>
        <td><img src="${country.flag}" width="50"></td>
        <td>${country.name}</td>
        <td>${country.code}</td>
        <td>${country.capital}</td>
        <td>${country.currency.name} (${country.currency.symbol || ''})</td>
        <td>${country.language.name}</td>
      </tr>
    `;
    tableBody.innerHTML += row;
  }
}

// Function to load more countries
(window as any).loadMore = async function () {
  currentIndex += 10;
  await fetchMoreCountries();
  updateTable();
};

// Function to show fewer countries
(window as any).showLess = function () {
  currentIndex = Math.max(0, currentIndex - 10);
  updateTable();
};

// Function to fetch more countries from the server
async function fetchMoreCountries() {
  try {
    console.log('Fetching more countries...');
    const response = await axios.get(`http://localhost:3004/countries`, {
      params: {
        ...getLastSearchParameters(),
        _sort: 'name',
        _order: 'asc',
        _start: currentIndex,
        _limit: 20,
      },
    });
    const moreCountries = response.data;
    countries = countries.concat(moreCountries);
  } catch (error) {
    console.error('Error fetching more countries:', error);
  }
}

// Function to get the last used search parameters
function getLastSearchParameters(): { [key: string]: string } {
  const searchInputs = document.querySelectorAll('.form-control');
  const lastSearchParameters: { [key: string]: string } = {};

  searchInputs.forEach((input: HTMLInputElement) => {
    const option = input.id.replace('Input', '');
    const searchTerm = input.value.trim().toLowerCase();

    if (searchTerm !== '') {
      lastSearchParameters[`${option}_like`] = searchTerm;
    }
  });

  return lastSearchParameters;
}

// Fetch initial countries and attach the loadMore, showLess, and searchCountries functions when the page loads
document.addEventListener('DOMContentLoaded', () => {
  fetchCountries().then(() => {
    // Attach the loadMore, showLess, and searchCountries functions to the respective buttons and input fields
    const loadMoreButton = document.querySelector('.load-more');
    const showLessButton = document.querySelector('.show-less');
    const searchInputs = document.querySelectorAll('.form-control');

    if (loadMoreButton && showLessButton && searchInputs) {
      loadMoreButton.addEventListener('click', (window as any).loadMore);
      showLessButton.addEventListener('click', (window as any).showLess);
      searchInputs.forEach(input => {
        input.addEventListener('input', (window as any).searchCountries);
      });
    }
  });
});

