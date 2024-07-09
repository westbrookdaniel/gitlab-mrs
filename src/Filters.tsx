import {
  Button,
  HStack,
  Text,
  Icon,
  IconButton,
  Input,
  Menu,
  MenuButton,
  MenuDivider,
  MenuGroup,
  MenuItem,
  MenuList,
  Stack,
  Tag,
  Select,
} from "@chakra-ui/react";
import { Filter, useConfig } from "./store";
import { useEffect, useState } from "react";
import { MdClear, MdMoreVert } from "react-icons/md";

const fields: Record<string, string> = {
  title: "Title",
  "author.username": "Author Username",
};

export function Filters() {
  const { filters, addFilter, removeFilter, clearFilters, config } =
    useConfig();

  const [current, setCurrent] = useState<Filter | null>(
    filters.find((f) => f.id === "search") ?? null,
  );

  const [field, setField] = useState<string>(current?.data?.field ?? "title");
  const [text, setText] = useState<string>(current?.data?.text ?? "");

  useEffect(() => {
    setCurrent({
      id: "search",
      label: "Search",
      fn: `(mr) => mr.${field}.toLowerCase().includes("${text}".toLowerCase())`,
      data: { text, field },
    });
  }, [field, text]);

  useEffect(() => {
    removeFilter("search");
    if (!current) return;
    console.log(current);
    addFilter(current);
  }, [addFilter, removeFilter, current]);

  const displayFilters = filters.filter((f) => f.id !== "search");

  return (
    <Stack mb={2}>
      <HStack
        mb={2}
        as="form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim() || !current) return;
          console.log(current);
          addFilter({
            ...current,
            id: crypto.randomUUID(),
            label: `${fields[field]} includes ${text}`,
          });
          setText("");
        }}
      >
        <Select
          maxW="200px"
          value={field}
          onChange={(e) => setField(e.target.value)}
        >
          {Object.entries(fields).map(([field, name]) => (
            <option key={field} value={field}>
              {name}
            </option>
          ))}
        </Select>
        <Input
          placeholder="Filter..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <Button whiteSpace="nowrap" minW="120px" type="submit">
          Add Filter
        </Button>

        <Menu>
          <MenuButton
            as={IconButton}
            aria-label="Options"
            icon={<MdMoreVert />}
            fontSize="xl"
            variant="outline"
          />
          <MenuList>
            <MenuGroup>
              <Text fontSize="sm" fontWeight="bold" px={3} pt={1} pb={2}>
                Quick Filters
              </Text>
              <MenuItem
                onClick={() => {
                  addFilter({
                    id: crypto.randomUUID(),
                    label: "Non-Draft",
                    fn: '(mr) => !mr.title.toLowerCase().includes("draft")',
                  });
                }}
              >
                Non-Drafts
              </MenuItem>
              <MenuItem
                onClick={() => {
                  addFilter({
                    id: crypto.randomUUID(),
                    label: "Draft",
                    fn: '(mr) => mr.title.toLowerCase().includes("draft")',
                  });
                }}
              >
                Drafts
              </MenuItem>
              <MenuItem
                onClick={() => {
                  addFilter({
                    id: crypto.randomUUID(),
                    label: "Yours",
                    fn: `(mr) => mr.author.username === "${config?.currentUser?.username ?? ""}"`,
                  });
                }}
              >
                Yours
              </MenuItem>
            </MenuGroup>
            <MenuDivider />
            <MenuItem onClick={clearFilters}>Clear Filters</MenuItem>
          </MenuList>
        </Menu>
      </HStack>
      {displayFilters.length === 0 ? null : (
        <HStack mb={2}>
          {displayFilters.map((f) => (
            <Tag key={f.id} pr={0}>
              {f.label}
              <IconButton
                onClick={() => removeFilter(f.id)}
                icon={<Icon as={MdClear} />}
                size="xs"
                fontSize="sm"
                aria-label="Refetch"
                ml={2}
              />
            </Tag>
          ))}
        </HStack>
      )}
    </Stack>
  );
}
