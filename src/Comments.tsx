import {
  Box,
  Popover,
  PopoverContent,
  PopoverBody,
  Button,
  Text,
  useDisclosure,
  Tooltip,
  Link,
  Avatar,
  HStack,
  Stack,
  Center,
  Spinner,
  useColorMode,
  Tag,
} from "@chakra-ui/react";
import { useQuery } from "urql";
import { MergeRequestNode } from "./types";
import { useConfig } from "./store";

interface Props {
  mergeRequest: MergeRequestNode;
}

interface CommentMergeRequestNode {
  project: {
    mergeRequest: {
      iid: string;
      discussions: {
        nodes: {
          id: string;
          resolved: boolean;
          resolvable: boolean;
          notes: {
            edges: {
              node: {
                id: string;
                bodyHtml: string;
                system: boolean;
                author: {
                  id: string;
                  name: string;
                  webUrl: string;
                  avatarUrl: string;
                };
              };
            }[];
          };
        }[];
      };
    };
  };
}

const getMergeRequestsQuery = (projectPath: string, iid: string) => `
  {
    project(fullPath: "${projectPath}") {
      mergeRequest(iid: "${iid}") {
        iid
        discussions {
          nodes {
            id
            resolved
            resolvable
            notes {
              edges {
                node {
                  id
                  bodyHtml
                  system
                  author {
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
    }
  }
`;

export function Comments({ mergeRequest }: Props) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  return (
    <>
      <Button size="sm" onClick={onOpen} variant="link">
        <Text>
          {mergeRequest.commenters.edges.length === 0
            ? "Activity"
            : `${mergeRequest.userNotesCount} Comments by`}
        </Text>
        <HStack
          spacing={1}
          ml={mergeRequest.commenters.edges.length === 0 ? 0 : 1.5}
        >
          {mergeRequest.commenters.edges.map((edge) => (
            <Tooltip key={edge.node.id} label={edge.node.name}>
              <Link href={edge.node.webUrl} isExternal>
                <Avatar
                  size="xs"
                  mt="0.5"
                  boxSize="18"
                  name={edge.node.name}
                  src={"https://gitlab.com" + edge.node.avatarUrl}
                />
              </Link>
            </Tooltip>
          ))}
        </HStack>
      </Button>
      <CommentsPopover
        mergeRequest={mergeRequest}
        isOpen={isOpen}
        onOpen={onOpen}
        onClose={onClose}
      />
    </>
  );
}

function CommentsPopover({
  mergeRequest,
  isOpen,
  onOpen,
  onClose,
}: Props & {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  const config = useConfig((s) => s.config);
  const isLight = useColorMode().colorMode === "light";

  const [{ data, fetching }] = useQuery<CommentMergeRequestNode>({
    query: getMergeRequestsQuery(config?.projectId ?? "", mergeRequest.iid),
    pause: !config?.projectId || !isOpen,
    requestPolicy: "cache-and-network",
  });

  const threads = data?.project?.mergeRequest.discussions.nodes;

  return (
    <Popover isOpen={isOpen} onOpen={onOpen} onClose={onClose}>
      <PopoverContent w="2xl">
        <PopoverBody maxH="600px" overflow="auto" p={2}>
          {fetching ? (
            <Center p={4}>
              <Spinner />
            </Center>
          ) : (
            <Stack>
              {threads?.length === 0 && (
                <Center p={4}>
                  <Text>No Activity</Text>
                </Center>
              )}
              {threads?.map((thread, i) => {
                const isUserThread = thread.notes.edges.some(
                  (e) => !e.node.system,
                );
                return (
                  <Stack
                    border={isUserThread ? "1px solid" : "none"}
                    borderColor={isLight ? "gray.200" : "gray.600"}
                    borderRadius="md"
                    key={i}
                    py={isUserThread ? 2 : 1}
                    px={isUserThread ? 2 : 2}
                  >
                    {thread.notes.edges.map((note, index) => {
                      if (note.node.system) {
                        return (
                          <Stack
                            alignItems="baseline"
                            spacing={0}
                            fontSize="xs"
                            color={isLight ? "gray.500" : "gray.500"}
                          >
                            <Link
                              key={index}
                              fontWeight="bold"
                              href={note.node.author.webUrl}
                              isExternal
                            >
                              {note.node.author.name}
                            </Link>
                            <Box
                              __css={{
                                "ul, ol": {
                                  ml: 8,
                                },
                              }}
                              dangerouslySetInnerHTML={{
                                __html: note.node.bodyHtml,
                              }}
                            />
                          </Stack>
                        );
                      }
                      return (
                        <Stack spacing={0}>
                          <Link
                            key={index}
                            fontSize="xs"
                            fontWeight="bold"
                            href={note.node.author.webUrl}
                            isExternal
                            color={isLight ? "gray.500" : "gray.500"}
                          >
                            {note.node.author.name}
                          </Link>
                          <Box
                            __css={{
                              "ul, ol": {
                                ml: 8,
                              },
                            }}
                            dangerouslySetInnerHTML={{
                              __html: note.node.bodyHtml,
                            }}
                          />
                        </Stack>
                      );
                    })}
                    {thread.resolvable && (
                      <Box my={1}>
                        {thread.resolved ? (
                          <Tag mr={2} colorScheme="green" fontSize="sm">
                            Resolved
                          </Tag>
                        ) : (
                          <Tag mr={2} colorScheme="red" fontSize="sm">
                            Not Resolved
                          </Tag>
                        )}
                      </Box>
                    )}
                  </Stack>
                );
              })}
            </Stack>
          )}
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}
