import { Icon, useColorMode } from "@chakra-ui/react";
import { GoDotFill } from "react-icons/go";

// eslint-disable-next-line react-refresh/only-export-components
export function wrapAvatar(url: string) {
  if (!url.startsWith("http")) return "https://gitlab.com" + url;
  return url;
}

export function Dot() {
  const isLight = useColorMode().colorMode === "light";
  return (
    <Icon
      as={GoDotFill}
      ml={2}
      mt={0.5}
      fontSize="8px"
      color={isLight ? "gray.200" : "gray.700"}
    />
  );
}
