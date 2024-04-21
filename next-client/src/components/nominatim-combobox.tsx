"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { useDebounceCallback } from "usehooks-ts";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
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

type NominatimLocation = {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  class: string;
  type: string;
  place_rank: number;
  importance: number;
  addresstype: string;
  name: string;
  display_name: string;
  boundingbox: Array<string>;
};

export type NominatimComboboxProps = {
  onSelect?: (coordinate: L.LatLngTuple) => unknown;
};

export function NominatimCombobox(props?: NominatimComboboxProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [options, setOptions] = useState<Array<NominatimLocation>>([]);

  const handleInput = async (e: React.FormEvent<HTMLInputElement>) => {
    const searchParams = new URLSearchParams();

    searchParams.set("amenity", e.target.value);
    searchParams.set("format", "json");

    const response = await fetch(
      "https://nominatim.openstreetmap.org/search?" + searchParams.toString(),
    );

    const data: NominatimLocation[] = await response.json();

    setOptions(data);
  };

  const debouncedHandleInput = useDebounceCallback(handleInput, 500);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between truncate"
        >
          {value
            ? options.find((option) => `${option.lat}:${option.lon}` === value)
                ?.display_name
            : "Select location..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[200px] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search framework..."
            onInput={debouncedHandleInput}
          />

          <CommandEmpty>No framework found.</CommandEmpty>

          <CommandGroup>
            {options.map((option) => (
              <CommandItem
                className="truncate line-clamp-1"
                key={option.osm_id}
                value={`${option.lat}:${option.lon}`}
                onSelect={(currentValue) => {
                  setValue(
                    currentValue === value ? "" : `${option.lat}:${option.lon}`,
                  );
                  setOpen(false);
                  props?.onSelect?.([+option.lat, +option.lon]);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === `${option.lat}:${option.lon}`
                      ? "opacity-100"
                      : "opacity-0",
                  )}
                />
                {option.display_name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
