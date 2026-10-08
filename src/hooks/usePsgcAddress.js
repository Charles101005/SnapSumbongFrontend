import {
  getAllMunicipalities,
  getAllProvinces,
  getAllRegions,
  getBarangaysByMunicipality,
  getMunicipalitiesByProvince,
  getProvincesByRegion,
} from "@aivangogh/ph-address";

const ACRONYMS = new Set(["NCR", "CAR", "BARMM", "NIR"]);
const SMALL_WORDS = new Set(["of", "and", "the"]);

// Turns a stored value into a readable label when it is not a PSGC code
// (legacy placeholder records such as "BRGY-TONDO" or "CITY-OF-MANILA").
const prettify = (value) =>
  value
    .split("-")
    .map((word) => {
      const upper = word.toUpperCase();
      if (SMALL_WORDS.has(upper)) return upper.toLowerCase();
      if (ACRONYMS.has(upper)) return upper;
      return upper.charAt(0) + upper.slice(1).toLowerCase();
    })
    .join(" ");

// PSGC buckets that hold cities but are not real province records: NCR uses
// the region code as its bucket, plus two orphan buckets (Isabela City and
// the BARMM Special Geographic Area).
const PSEUDO_PROVINCE_LABELS = {
  "1300000000": "Metro Manila",
  "0990100000": "Isabela City",
  "1999900000": "Special Geographic Area (BARMM)",
};

const toOption = (item) => ({ value: item.psgcCode, label: item.name });

let tree = null;

const getTree = () => {
  if (tree) return tree;

  const regionOptions = getAllRegions().map((region) => ({
    value: region.psgcCode,
    label: region.designation ? `${region.name} (${region.designation})` : region.name,
  }));

  const provinceOptionsByRegion = new Map(
    regionOptions.map(({ value }) => [value, getProvincesByRegion(value).map(toOption)])
  );

  const municipalities = getAllMunicipalities();
  const realProvinceCodes = new Set(getAllProvinces().map((province) => province.psgcCode));
  const municipalityCodes = new Set(municipalities.map((municipality) => municipality.psgcCode));

  const bucketsByRegion = new Map();
  for (const municipality of municipalities) {
    const bucket = municipality.provinceCode;
    if (realProvinceCodes.has(bucket) || municipalityCodes.has(bucket)) continue;
    const regionCode = `${municipality.psgcCode.slice(0, 2)}00000000`;
    const buckets = bucketsByRegion.get(regionCode) || new Map();
    const children = buckets.get(bucket) || [];
    children.push(municipality);
    buckets.set(bucket, children);
    bucketsByRegion.set(regionCode, buckets);
  }

  for (const [regionCode, buckets] of bucketsByRegion) {
    const options = provinceOptionsByRegion.get(regionCode) || [];
    for (const [bucketCode, children] of buckets) {
      const label =
        PSEUDO_PROVINCE_LABELS[bucketCode] ||
        (children.length === 1 ? children[0].name : "Other Cities/Municipalities");
      options.push({ value: bucketCode, label });
    }
    provinceOptionsByRegion.set(regionCode, options);
  }

  // Districts hang their barangays off a city-level code (only Manila City
  // has districts: its 897 barangays live under 14 district records).
  const districtsByCity = new Map();
  for (const municipality of municipalities) {
    if (!municipalityCodes.has(municipality.provinceCode)) continue;
    const districts = districtsByCity.get(municipality.provinceCode) || [];
    districts.push(municipality);
    districtsByCity.set(municipality.provinceCode, districts);
  }

  tree = { regionOptions, provinceOptionsByRegion, districtsByCity };
  return tree;
};

const withFallback = (options, value) => {
  if (!value || options.some((option) => option.value === value)) return options;
  return [{ value, label: prettify(value) }, ...options];
};

const getCityOptions = (province) =>
  province ? getMunicipalitiesByProvince(province).map(toOption) : [];

const getBarangayOptions = (city) => {
  if (!city) return [];
  const direct = getBarangaysByMunicipality(city);
  if (direct.length) return direct.map(toOption);
  const districts = getTree().districtsByCity.get(city) || [];
  const merged = districts.flatMap((district) =>
    getBarangaysByMunicipality(district.psgcCode).map((barangay) => ({
      value: barangay.psgcCode,
      label: `${barangay.name} (${district.name})`,
    }))
  );
  return merged.sort((a, b) => a.label.localeCompare(b.label));
};

export function usePsgcAddress({
  region,
  province,
  city,
  barangay,
  setRegion,
  setProvince,
  setCity,
  setBarangay,
}) {
  const { regionOptions, provinceOptionsByRegion } = getTree();

  const rawProvinceOptions = (region && provinceOptionsByRegion.get(region)) || [];
  const rawCityOptions = getCityOptions(province);
  const rawBarangayOptions = getBarangayOptions(city);

  // Each level narrows the next; a parent change clears every child selection
  // so stale combinations can't be saved.
  const handleRegionChange = (event) => {
    setRegion(event.target.value);
    setProvince("");
    setCity("");
    setBarangay("");
  };

  const handleProvinceChange = (event) => {
    setProvince(event.target.value);
    setCity("");
    setBarangay("");
  };

  const handleCityChange = (event) => {
    setCity(event.target.value);
    setBarangay("");
  };

  return {
    regionOptions: withFallback(regionOptions, region),
    provinceOptions: withFallback(rawProvinceOptions, province),
    cityOptions: withFallback(rawCityOptions, city),
    barangayOptions: withFallback(rawBarangayOptions, barangay),
    canSelectProvince: rawProvinceOptions.length > 0,
    canSelectCity: rawCityOptions.length > 0,
    canSelectBarangay: rawBarangayOptions.length > 0,
    handleRegionChange,
    handleProvinceChange,
    handleCityChange,
  };
}
