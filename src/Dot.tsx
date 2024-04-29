import { Icon } from "@chakra-ui/react";


export function Dot() {
        return (
                <Icon
                        as={GoDotFill}
                        ml={2}
                        mt={0.5}
                        fontSize="xs"
                        color={isLight ? "gray.200" : "gray.700"} />
        );
}

