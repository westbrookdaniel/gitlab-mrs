import {
  FaCheckCircle,
  FaTimesCircle,
  FaQuestionCircle,
  FaPlayCircle,
} from "react-icons/fa";
import { Tooltip, Icon } from "@chakra-ui/react";

interface Props {
  status: string;
}

export default function PipelineStatusIcon({ status }: Props) {
  const statusMap = {
    RUNNING: {
      icon: FaPlayCircle,
      color: "blue.500",
      label: "Pending",
    },
    FAILED: {
      icon: FaTimesCircle,
      color: "red.500",
      label: "Failed",
    },
    SUCCESS: {
      icon: FaCheckCircle,
      color: "green.500",
      label: "Success",
    },
  };

  const statusData = statusMap[status as keyof typeof statusMap] || {
    icon: FaQuestionCircle,
    color: "gray",
    label: status,
  };

  const { icon: IconComponent, color, label } = statusData;

  return (
    <Tooltip label={label} placement="top" shouldWrapChildren>
      <Icon as={IconComponent} color={color} mr={2} />
    </Tooltip>
  );
}
