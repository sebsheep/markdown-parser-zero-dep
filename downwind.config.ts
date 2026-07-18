import type { DownwindConfig } from "@arnaud-barre/downwind";

export const config: DownwindConfig = {
  theme: {
    extend: {
      fontSize: {
        "14": ["14px", "20px"],
        "16": ["16px", "24px"],
        "18": ["18px", "26px"],
      },
    },
  },
};
