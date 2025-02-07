import React from "react";
import { Box, keyframes } from "@mui/material";

const bounce = keyframes`
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
`;

const ThinkingAnimation = () => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "flex-start",
      mb: 2,
      // justifyContent: "center",
      // alignItems: "center",
      // gap: "6px",
    }}
  >
    {[0, 1, 2].map((i) => (
      <Box
        key={i}
        sx={{
          width: "10px",
          height: "10px",
          borderRadius: "50%",
          backgroundColor: "#555",
          animation: `${bounce} 1.4s ease-in-out infinite`,
          animationDelay: `${i * 0.2}s`,
        }}
      />
    ))}
  </Box>
);

export default ThinkingAnimation;
