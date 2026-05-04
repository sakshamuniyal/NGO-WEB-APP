import { useEffect, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Command,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Import JSON data directly
import countries from "@/data/countries.json";
import states from "@/data/states.json";

// ⭐ Exporting all interfaces ⭐
export interface Timezone {
  zoneName: string;
  gmtOffset: number;
  gmtOffsetName: string;
  abbreviation: string;
  tzName: string;
}

export interface CountryProps {
  id: number;
  name: string;
  iso3: string;
  iso2: string; // <-- Used for country lookup
  numeric_code: string;
  phone_code: string;
  capital: string;
  currency: string;
  currency_name: string;
  currency_symbol: string;
  tld: string;
  native: string;
  region: string;
  region_id: string;
  subregion: string;
  subregion_id: string;
  nationality: string;
  timezones: Timezone[];
  translations: Record<string, string>;
  latitude: string;
  longitude: string;
  emoji: string;
  emojiU: string;
}

export interface StateProps {
  id: number;
  name: string; // <-- Used for state lookup
  country_id: number;
  country_code: string;
  state_code: string;
  type: string | null;
  latitude: string;
  longitude: string;
}

export interface LocationSelectorProps {
  disabled?: boolean;
  onCountryChange?: (country: CountryProps | null) => void;
  onStateChange?: (state: StateProps | null) => void;
  countryCode?: string; // Expected to be ISO2 (e.g., "IN")
  stateName?: string; // Expected to be the full state name (e.g., "Delhi")
}

const LocationSelector = ({
  disabled,
  onCountryChange,
  onStateChange,
  countryCode, // Now expects ISO2
  stateName, // Still expects full name
}: LocationSelectorProps) => {
  const countriesData = countries as CountryProps[];
  const statesData = states as StateProps[];

  const [selectedCountry, setSelectedCountry] = useState<CountryProps | null>(
    null
  );
  const [selectedState, setSelectedState] = useState<StateProps | null>(null);
  const [openCountryDropdown, setOpenCountryDropdown] = useState(false);
  const [openStateDropdown, setOpenStateDropdown] = useState(false);

  // Available states are filtered based on the current `selectedCountry`
  const availableStates = selectedCountry
    ? statesData.filter((state) => state.country_id === selectedCountry.id)
    : [];

  const handleCountrySelect = (country: CountryProps | null) => {
    setSelectedCountry(country);
    setSelectedState(null); // Reset state when country changes
    onCountryChange?.(country);
    onStateChange?.(null); // Notify parent that state is reset
    setOpenCountryDropdown(false); // Close dropdown on selection
  };

  const handleStateSelect = (stateCode: string) => {
    if (selectedCountry) {
      // Find the state by its state_code within the available states
      const state = availableStates.find((s) => s.state_code === stateCode);
      setSelectedState(state || null);
      onStateChange?.(state || null); // Pass the full state object
    }
    setOpenStateDropdown(false); // Close dropdown on selection
  };

  useEffect(() => {
    let currentCountry: CountryProps | null = null;
    let currentStates: StateProps[] = [];
    let currentSelectedState: StateProps | null = null;

    // 1. Determine the initial country based on props or default to India
    if (countryCode) {
      // ⭐ MODIFIED: Find country by iso2 instead of name ⭐
      currentCountry =
        countriesData.find((c) => c.iso2 === countryCode) || null;
    } else {
      // Default to India if no countryCode is provided
      currentCountry = countriesData.find((c) => c.name === "India") || null; // Still defaulting by name
    }

    // 2. If a valid country is found, filter its states and then try to find the initial state
    if (currentCountry) {
      currentStates = statesData.filter(
        (state) => state.country_id === currentCountry.id
      );

      if (stateName) {
        // Still finding state by name (as provided by user.address?.state)
        currentSelectedState =
          currentStates.find((s) => s.name === stateName) || null;
      }
    }

    setSelectedCountry(currentCountry);
    setSelectedState(currentSelectedState);
  }, [countryCode, stateName]);

  return (
    <div className="flex gap-4">
      {/* Country Selector */}
      <Popover open={openCountryDropdown} onOpenChange={setOpenCountryDropdown}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={openCountryDropdown}
            disabled={disabled}
            className="w-full justify-between"
          >
            {selectedCountry ? (
              <div className="flex items-center gap-2">
                <span>{selectedCountry.emoji}</span>
                <span>{selectedCountry.name}</span>
              </div>
            ) : (
              <span>Select Country...</span>
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder="Search country..." />
            <CommandList>
              <CommandEmpty>No country found.</CommandEmpty>
              <CommandGroup>
                <ScrollArea className="h-[300px]">
                  {countriesData.map((country) => (
                    <CommandItem
                      key={country.id}
                      value={country.name} // CommandItem value for searching still uses name
                      onSelect={() => handleCountrySelect(country)}
                      className="flex cursor-pointer items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span>{country.emoji}</span>
                        <span>{country.name}</span>
                      </div>
                      <Check
                        className={cn(
                          "h-4 w-4",
                          selectedCountry?.id === country.id
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                  <ScrollBar orientation="vertical" />
                </ScrollArea>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* State Selector */}
      {selectedCountry && availableStates.length > 0 && (
        <Popover open={openStateDropdown} onOpenChange={setOpenStateDropdown}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openStateDropdown}
              disabled={!selectedCountry || availableStates.length === 0}
              className="w-full justify-between"
            >
              {selectedState ? (
                <span>{selectedState.name}</span>
              ) : (
                <span>Select State...</span>
              )}
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0">
            <Command>
              <CommandInput placeholder="Search state..." />
              <CommandList>
                <CommandEmpty>No state found.</CommandEmpty>
                <CommandGroup>
                  <ScrollArea className="h-[300px]">
                    {availableStates.map((state) => (
                      <CommandItem
                        key={state.id}
                        value={state.name} // CommandItem value for searching remains 'name'
                        onSelect={() => handleStateSelect(state.state_code)}
                        className="flex cursor-pointer items-center justify-between text-sm"
                      >
                        <span>{state.name}</span>
                        <Check
                          className={cn(
                            "h-4 w-4",
                            selectedState?.id === state.id
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    ))}
                    <ScrollBar orientation="vertical" />
                  </ScrollArea>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};

export default LocationSelector;
