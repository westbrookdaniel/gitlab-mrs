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
  Select,
  Stack,
  Tag,
} from "@chakra-ui/react";
import { useConfig } from "./store";
import { useState } from "react";
import { MdClear, MdMoreVert } from "react-icons/md";

const fields: Record<string, string> = {
  title: "Title",
  "author.username": "Author Username",
};

export function Filters() {
  const { filters, addFilter, removeFilter, clearFilters, config } =
    useConfig();

  const [text, setText] = useState("");
  const [field, setField] = useState("title");
  const [type, setType] = useState("includes");

  return (
    <Stack mb={2}>
      <HStack
        mb={2}
        as="form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim() || !field || !type) return;
          console.log({ text, field, type });
          addFilter({
            id: crypto.randomUUID(),
            name: fields[field] ?? "Unknown",
            field,
            [type]: text,
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
        <Select
          maxW="150px"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="includes">Includes</option>
          <option value="matches">Matches</option>
          <option value="excludes">Excludes</option>
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
                    field: "title",
                    name: "Title",
                    excludes: "Draft",
                  });
                }}
              >
                Non-Drafts
              </MenuItem>
              <MenuItem
                onClick={() => {
                  addFilter({
                    id: crypto.randomUUID(),
                    field: "title",
                    name: "Title",
                    includes: "Draft",
                  });
                }}
              >
                Drafts
              </MenuItem>
              <MenuItem
                onClick={() => {
                  addFilter({
                    id: crypto.randomUUID(),
                    field: "author.username",
                    name: "Author Username",
                    includes: config?.currentUser?.username,
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
      {filters.length === 0 ? null : (
        <HStack mb={2}>
          {filters.map((f) => (
            <Tag key={f.id} pr={0}>
              {f.name}{" "}
              {f.includes ? "includes" : f.matches ? "matches" : "excludes"}{" "}
              {f.includes ?? f.matches ?? f.excludes}
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
