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
} from "@chakra-ui/react";
import { FaExclamationTriangle } from "react-icons/fa";
import { formatDistance, parseISO } from "date-fns";
import PipelineStatusIcon from "./PipelineStatusIcon";
import { IoReload } from "react-icons/io5";

interface User {
  username: string;
  avatarUrl?: string;
}

interface Config {
  currentUser: User | null;
  projectId: string;
  gitlabToken: string;
}

interface MergeRequestNode {
  id: string;
  webUrl: string;
  title: string;
  conflicts: boolean;
  createdAt: string;
  updatedAt: string;
  approvalsLeft: number;
  userNotesCount: number;
  userDiscussionsCount: number;
  headPipeline: {
    status: string;
  };
  labels: {
    edges: {
      node: {
        id: string;
        color: string;
        title: string;
      };
    }[];
  };
  assignees: {
    edges: {
      node: {
        id: string;
        name: string;
        webUrl: string;
        avatarUrl: string;
      };
    }[];
  };
  commenters: {
    edges: {
      node: {
        id: string;
        name: string;
        webUrl: string;
        avatarUrl: string;
      };
    }[];
  };
  author: {
    id: string;
    name: string;
    webUrl: string;
    avatarUrl: string;
  };
  approvedBy: {
    edges: {
      node: {
        id: string;
        name: string;
        webUrl: string;
        avatarUrl: string;
      };
    }[];
  };
}

interface ProjectData {
  project?: {
    mergeRequests: {
      nodes: MergeRequestNode[];
    };
  };
}

const client = new Client({
  url: "https://gitlab.com/api/graphql",
  exchanges: [cacheExchange, fetchExchange],
  fetchOptions: () => {
    const token = getStoredConfig()?.gitlabToken;
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
          id
          webUrl
          title
          conflicts
          createdAt
          updatedAt
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

function getStoredConfig(): Config | null {
  const storedUser = localStorage.getItem("mr-config");
  if (storedUser) {
    return JSON.parse(storedUser);
  }
  return null;
}

function useConfig() {
  const [config, setConfig] = useState<Config | null>(getStoredConfig());

  const handleConfigCHange = (user: Config) => {
    setConfig(user);
    localStorage.setItem("mr-config", JSON.stringify(user));
  };

  return [config, handleConfigCHange] as const;
}

interface UserConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserConfigModal: React.FC<UserConfigModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [config, onConfigChange] = useConfig();
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

    onConfigChange({
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
          <Text mb={4}>All configuration is stored in local storage</Text>
          <FormControl id="projectId" mb={4}>
            <FormLabel>Project ID</FormLabel>
            <Input
              type="text"
              placeholder="gitlab-org/gitlab-foss"
              value={form.projectId}
              onChange={(e) =>
                setForm((f) => ({ ...f, projectId: e.target.value }))
              }
            />
          </FormControl>

          <FormControl id="gitlabToken" mb={4}>
            <FormLabel>Gitlab API Token</FormLabel>
            <Input
              type="text"
              value={form.gitlabToken}
              onChange={(e) =>
                setForm((f) => ({ ...f, gitlabToken: e.target.value }))
              }
            />
          </FormControl>

          <FormControl id="username" mb={4}>
            <FormLabel>Username</FormLabel>
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
          <Button colorScheme="blue" mr={3} type="submit">
            Save
          </Button>
          <Button variant="ghost" onClick={onClose} type="button">
            Cancel
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
  return (
    <List spacing={2}>
      {mergeRequests.map((mergeRequest) => (
        <ListItem
          key={mergeRequest.id}
          pt={2}
          pb={1}
          borderTop="1px solid"
          borderColor="gray.200"
        >
          <Flex justify="space-between" align="center">
            <Heading size="sm">
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
                <PipelineStatusIcon status={mergeRequest.headPipeline.status} />
              </Flex>
              <Text mr={2} fontSize="sm">
                {mergeRequest.approvalsLeft} Needed
              </Text>
              {mergeRequest.approvedBy.edges.length === 0 ? null : (
                <Flex>
                  {mergeRequest.approvedBy.edges.map((edge) => (
                    <Tooltip key={edge.node.id} label={edge.node.name}>
                      <Link href={edge.node.webUrl} isExternal mr={1}>
                        <Avatar
                          size="xs"
                          name={edge.node.name}
                          src={"https://gitlab.com" + edge.node.avatarUrl}
                        />
                      </Link>
                    </Tooltip>
                  ))}
                </Flex>
              )}
            </Flex>
          </Flex>
          <HStack alignItems="baseline" spacing={4} mb={2}>
            <Flex justify="space-between" align="center">
              <Text size="sm" fontSize="sm">
                Created{" "}
                {formatDistance(parseISO(mergeRequest.createdAt), new Date())}{" "}
                by{" "}
                <Link href={mergeRequest.author.webUrl} isExternal>
                  {mergeRequest.author.name}
                </Link>
              </Text>
              <HStack ml={2}>
                <Flex>
                  {mergeRequest.assignees.edges.map((edge) => (
                    <Tooltip key={edge.node.id} label={edge.node.name}>
                      <Link href={edge.node.webUrl} isExternal mr={1}>
                        <Avatar
                          size="xs"
                          name={edge.node.name}
                          src={"https://gitlab.com" + edge.node.avatarUrl}
                        />
                      </Link>
                    </Tooltip>
                  ))}
                </Flex>
              </HStack>
            </Flex>
            <Flex justify="flex-start" align="center">
              <Text mr={2} fontSize="sm">
                {mergeRequest.commenters.edges.length === 0
                  ? ""
                  : `${mergeRequest.userNotesCount} Comments (${mergeRequest.userDiscussionsCount} Threads) by`}
              </Text>
              <Flex>
                {mergeRequest.commenters.edges.map((edge) => (
                  <Tooltip key={edge.node.id} label={edge.node.name}>
                    <Link href={edge.node.webUrl} isExternal mr={1}>
                      <Avatar
                        size="xs"
                        name={edge.node.name}
                        src={"https://gitlab.com" + edge.node.avatarUrl}
                      />
                    </Link>
                  </Tooltip>
                ))}
              </Flex>
            </Flex>
          </HStack>
          <HStack>
            {mergeRequest.labels.edges.map((edge) => (
              <Tag
                key={edge.node.id}
                bg={tinycolor(edge.node.color).setAlpha(0.3).toRgbString()}
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
  );
};

const App = () => {
  const [config] = useConfig();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [{ data, fetching, stale, error }, refetch] = useQuery<ProjectData>({
    query: getMergeRequestsQuery(config?.projectId ?? ""),
    pause: !config?.projectId,
    requestPolicy: "cache-and-network",
  });

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
            mr={4}
          />
          <Heading size="lg">Merge Requests</Heading>
        </Flex>

        <Avatar
          cursor="pointer"
          size="sm"
          onClick={openModal}
          src={config?.currentUser?.avatarUrl}
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
          <Text>
            Unable to find project. You may have insufficient permissions
          </Text>
        </Center>
      ) : (
        <MergeRequestList mergeRequests={mergeRequests} />
      )}
    </Container>
  );
};

const Root = () => (
  <Provider value={client}>
    <ChakraProvider>
      <App />
    </ChakraProvider>
  </Provider>
);

export default Root;
