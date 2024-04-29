import React, { useState } from "react";
import { Client, cacheExchange, fetchExchange, Provider, useQuery } from "urql";
import tinycolor from "tinycolor2";
import {
  Icon,
  Heading,
  Text,
  Button,
  Input,
  FormControl,
  FormLabel,
  List,
  ListItem,
  Link,
  Spinner,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Avatar,
  Flex,
  ChakraProvider,
  Tooltip,
  Container,
  Center,
  Tag,
  HStack,
  IconButton,
  useColorMode,
  extendTheme,
  Box,
  Code,
} from "@chakra-ui/react";
import {
  FaAsterisk,
  FaExclamationTriangle,
  FaMoon,
  FaSun,
} from "react-icons/fa";
import { formatDistance, parseISO } from "date-fns";
import PipelineStatusIcon from "./PipelineStatusIcon";
import { IoReload } from "react-icons/io5";
import { refocusExchange } from "@urql/exchange-refocus";
import { Filters } from "./Filters";
import { useConfig } from "./store";
import { MergeRequestNode, ProjectData } from "./types";
import { Comments } from "./Comments";
import { Dot, wrapAvatar } from "./util";

const client = new Client({
  url: "https://gitlab.com/api/graphql",
  exchanges: [refocusExchange(), cacheExchange, fetchExchange],
  fetchOptions: () => {
    const token = useConfig.getState().config?.gitlabToken;
    return {
      headers: { authorization: token ? `Bearer ${token}` : "" },
    };
  },
});

const getMergeRequestsQuery = (projectPath: string) => `
  {
    project(fullPath: "${projectPath}") {
      mergeRequests(state: opened) {
        nodes {
          iid
          id
          webUrl
          title
          conflicts
          createdAt
          updatedAt
          sourceBranch
          targetBranch
          approvalsLeft
          userNotesCount
          userDiscussionsCount
          headPipeline {
            status
          }
          labels {
            edges {
              node {
                id
                color
                title
              }
            }
          }
          assignees {
            edges {
              node {
                id
                name
                webUrl
                avatarUrl
              }
            }
          }
          commenters {
            edges {
              node {
                id
                name
                webUrl
                avatarUrl
              }
            }
          }
          author {
            id
            name
            username
            webUrl
            avatarUrl
          }
          approvedBy {
            edges {
              node {
                id
                name
                webUrl
                avatarUrl
              }
            }
          }
        }
      }
    }
  }
`;

interface UserConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserConfigModal: React.FC<UserConfigModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { config, setConfig } = useConfig();

  const [form, setForm] = useState({
    username: config?.currentUser?.username ?? "",
    projectId: config?.projectId ?? "",
    gitlabToken: config?.gitlabToken ?? "",
    isLoading: false,
  });

  const handleSubmit = async (e: React.FormEvent<HTMLElement>) => {
    setForm((f) => ({ ...f, isLoading: true }));
    e.preventDefault();

    let data: any = null;
    try {
      const res = await fetch(
        `https://gitlab.com/api/v4/users?username=${form.username}`,
      );
      data = await res.json();
    } catch (e) {
      console.error(e);
    }

    setConfig({
      projectId: form.projectId,
      gitlabToken: form.gitlabToken,
      currentUser: {
        username: form.username,
        avatarUrl: data?.[0]?.avatar_url,
      },
    });
    setForm((f) => ({ ...f, isLoading: false }));
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent as="form" onSubmit={(e) => void handleSubmit(e)}>
        <ModalHeader>Configuration</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text mb={8}>
            All configuration is stored in local storage, and kept on the
            client. I would recommend giving your API Token limited permissions
          </Text>
          <FormControl id="projectId" mb={6}>
            <FormLabel>Project ID</FormLabel>
            <Text fontSize="sm" mb={4}>
              This should be the project id (everything after gitlab.com)
              <br />
              not the project url
            </Text>
            <Input
              type="text"
              placeholder="gitlab-org/gitlab-foss"
              value={form.projectId}
              onChange={(e) =>
                setForm((f) => ({ ...f, projectId: e.target.value }))
              }
            />
          </FormControl>

          <FormControl id="gitlabToken" mb={6}>
            <FormLabel>Gitlab API Token</FormLabel>
            <Input
              type="password"
              value={form.gitlabToken}
              onChange={(e) =>
                setForm((f) => ({ ...f, gitlabToken: e.target.value }))
              }
            />
          </FormControl>

          <FormControl id="username" mb={6}>
            <FormLabel>Username</FormLabel>
            <Text fontSize="sm" mb={4}>
              Not required but recommended
            </Text>
            <Input
              type="text"
              placeholder="Enter your username"
              value={form.username}
              onChange={(e) =>
                setForm((f) => ({ ...f, username: e.target.value }))
              }
            />
          </FormControl>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" onClick={onClose} type="button" mr={3}>
            Cancel
          </Button>
          <Button colorScheme="blue" type="submit">
            Save
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

interface MergeRequestListProps {
  mergeRequests: MergeRequestNode[];
}

const MergeRequestList: React.FC<MergeRequestListProps> = ({
  mergeRequests,
}) => {
  const [config, applyFilters] = useConfig((s) => [s.config, s.applyFilters]);
  const isLight = useColorMode().colorMode === "light";

  const filteredMergeRequests = applyFilters(mergeRequests);

  return (
    <>
      <Filters />

      <List spacing={2}>
        {filteredMergeRequests.map((mergeRequest) => (
          <ListItem
            key={mergeRequest.id}
            pt={0}
            pb={3}
            borderBottom="1px solid"
            borderColor={isLight ? "gray.200" : "gray.700"}
            position="relative"
          >
            {mergeRequest.author.username === config?.currentUser?.username ? (
              <Box left={-8} top={4} position="absolute">
                <Tooltip label="Assigned To You" shouldWrapChildren>
                  <Icon
                    as={FaAsterisk}
                    color={isLight ? "gray.400" : "gray.600"}
                  />
                </Tooltip>
              </Box>
            ) : null}

            <Flex justify="space-between" align="center">
              <Heading
                size="sm"
                overflow="hidden"
                textOverflow="ellipsis"
                whiteSpace="nowrap"
                flex="1 1 auto"
                w="1px"
                mr={4}
              >
                <Link href={mergeRequest.webUrl} isExternal>
                  {mergeRequest.title}
                </Link>
              </Heading>
              <Flex align="center">
                <Flex pt={1}>
                  {mergeRequest.conflicts && (
                    <Tooltip label="Conflicts detected" shouldWrapChildren>
                      <Icon
                        as={FaExclamationTriangle}
                        color="orange.500"
                        mr={2}
                      />
                    </Tooltip>
                  )}
                  <PipelineStatusIcon
                    status={mergeRequest.headPipeline?.status}
                  />
                </Flex>
                {mergeRequest.approvalsLeft === 0 ? (
                  <Tag colorScheme="green" fontSize="sm">
                    Approved
                  </Tag>
                ) : (
                  <Text fontSize="sm">{mergeRequest.approvalsLeft} Needed</Text>
                )}
                {mergeRequest.approvedBy.edges.length === 0 ? null : (
                  <Flex ml={2}>
                    {mergeRequest.approvedBy.edges.map((edge) => (
                      <Tooltip key={edge.node.id} label={edge.node.name}>
                        <Link href={edge.node.webUrl} isExternal mr={1}>
                          <Avatar
                            size="xs"
                            boxSize="18"
                            mt="3px"
                            name={edge.node.name}
                            src={wrapAvatar(edge.node.avatarUrl)}
                          />
                        </Link>
                      </Tooltip>
                    ))}
                  </Flex>
                )}
              </Flex>
            </Flex>

            <Flex justifyContent="space-between">
              <HStack alignItems="baseline" spacing={2} mb={2}>
                <Flex justify="space-between" align="center">
                  <Text
                    size="sm"
                    fontSize="sm"
                    color={isLight ? "gray.600" : "gray.500"}
                  >
                    created{" "}
                    {formatDistance(
                      parseISO(mergeRequest.createdAt),
                      new Date(),
                      { addSuffix: true },
                    )}{" "}
                    by{" "}
                    <Link href={mergeRequest.author.webUrl} isExternal>
                      {mergeRequest.author.name}
                    </Link>
                  </Text>

                  <HStack
                    ml={mergeRequest.assignees.edges.length === 0 ? 0 : 2}
                  >
                    <Tooltip label="Assigned To">
                      <Flex>
                        {mergeRequest.assignees.edges.map((edge, i) => (
                          <Link
                            key={edge.node.id}
                            href={edge.node.webUrl}
                            isExternal
                            ml={i === 0 ? 0 : 1}
                          >
                            <Avatar
                              size="xs"
                              mt={1}
                              boxSize="18"
                              name={edge.node.name}
                              src={wrapAvatar(edge.node.avatarUrl)}
                            />
                          </Link>
                        ))}
                      </Flex>
                    </Tooltip>
                  </HStack>

                  <Dot />
                </Flex>
                <Flex justify="flex-start" align="center">
                  <Comments mergeRequest={mergeRequest} />
                </Flex>

                {!["main", "master"].includes(mergeRequest.targetBranch) ? (
                  <Tag size="sm" ml={2}>
                    {mergeRequest.targetBranch}
                  </Tag>
                ) : null}
              </HStack>
              <Text
                display="block"
                size="sm"
                fontSize="sm"
                color={isLight ? "gray.600" : "gray.500"}
              >
                updated{" "}
                {formatDistance(parseISO(mergeRequest.updatedAt), new Date(), {
                  addSuffix: true,
                })}
              </Text>
            </Flex>
            <HStack>
              {mergeRequest.labels.edges.map((edge) => (
                <Tag
                  key={edge.node.id}
                  bg={tinycolor(edge.node.color)
                    .setAlpha(isLight ? 0.3 : 0.4)
                    .lighten(isLight ? 0 : 50)
                    .toRgbString()}
                  color={tinycolor(edge.node.color).darken(80).toRgbString()}
                  size="sm"
                >
                  {edge.node.title}
                </Tag>
              ))}
            </HStack>
          </ListItem>
        ))}
      </List>
    </>
  );
};

const App = () => {
  const [config, applyFilters] = useConfig((s) => [s.config, s.applyFilters]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [{ data, fetching, stale, error }, refetch] = useQuery<ProjectData>({
    query: getMergeRequestsQuery(config?.projectId ?? ""),
    pause: !config?.projectId,
    requestPolicy: "cache-and-network",
  });
  const { colorMode, toggleColorMode } = useColorMode();

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const mergeRequests = data?.project?.mergeRequests.nodes;

  return (
    <Container maxW="container.lg" p={8}>
      <Flex alignItems="center" justify="space-between" mb={8}>
        <Flex>
          <IconButton
            onClick={() =>
              refetch({
                query: getMergeRequestsQuery(config?.projectId ?? ""),
                pause: !config?.projectId,
                requestPolicy: "cache-and-network",
              })
            }
            isLoading={stale || fetching}
            icon={<Icon as={IoReload} />}
            aria-label="Refetch"
            mr={2}
          />
          <IconButton
            onClick={toggleColorMode}
            aria-label="Toggle color mode"
            icon={<Icon as={colorMode === "light" ? FaSun : FaMoon} />}
            mr={4}
          />
          <Heading size="lg">
            {applyFilters(mergeRequests ?? []).length} Merge Requests
          </Heading>
        </Flex>

        <Avatar
          cursor="pointer"
          size="sm"
          onClick={openModal}
          src={
            config?.currentUser?.avatarUrl
              ? wrapAvatar(config?.currentUser?.avatarUrl)
              : undefined
          }
        />
      </Flex>
      <UserConfigModal
        isOpen={isModalOpen}
        onClose={() => {
          closeModal();
          refetch({
            query: getMergeRequestsQuery(config?.projectId ?? ""),
            pause: !config?.projectId,
            requestPolicy: "cache-and-network",
          });
        }}
      />

      {fetching ? (
        <Center p={8}>
          <Spinner />
        </Center>
      ) : error ? (
        <Center p={8}>
          <Text>Error: {error.message}</Text>
        </Center>
      ) : !mergeRequests ? (
        <Center p={8}>
          <Text mb={3} textAlign="center">
            Unable to find project. You may have insufficient permissions.
            <br />
            Click on the profile in the top right to configure your Project ID,
            Gitlab API Token, and Username.
          </Text>
        </Center>
      ) : (
        <MergeRequestList mergeRequests={mergeRequests} />
      )}
    </Container>
  );
};

const theme = extendTheme({
  semanticTokens: {
    colors: {
      "chakra-body-bg": {
        _dark: "gray.900",
      },
    },
  },
});

const Root = () => (
  <Provider value={client}>
    <ChakraProvider theme={theme}>
      <App />
    </ChakraProvider>
  </Provider>
);

export default Root;
