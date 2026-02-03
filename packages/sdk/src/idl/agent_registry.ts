export type AgentRegistry = {
  version: "0.1.0";
  name: "agent_registry";
  address: string;
  metadata: { name: string; version: string; spec: string };
  instructions: [
    {
      name: "registerAgent";
      discriminator: number[];
      accounts: [
        { name: "agent"; writable: true },
        { name: "owner"; writable: true; signer: true },
        { name: "systemProgram" }
      ];
      args: [
        { name: "metadataUri"; type: "string" },
        { name: "hourlyRate"; type: "u64" }
      ];
    },
    {
      name: "updateAgent";
      discriminator: number[];
      accounts: [
        { name: "agent"; writable: true },
        { name: "owner"; signer: true }
      ];
      args: [
        { name: "metadataUri"; type: { option: "string" } },
        { name: "hourlyRate"; type: { option: "u64" } },
        { name: "availability"; type: { option: "u8" } }
      ];
    },
    {
      name: "updateReputation";
      discriminator: number[];
      accounts: [
        { name: "agent"; writable: true },
        { name: "authority"; signer: true }
      ];
      args: [{ name: "newRating"; type: "u64" }];
    },
    {
      name: "addEarnings";
      discriminator: number[];
      accounts: [
        { name: "agent"; writable: true },
        { name: "authority"; signer: true }
      ];
      args: [{ name: "amount"; type: "u64" }];
    }
  ];
  accounts: [
    {
      name: "agent";
      discriminator: number[];
    }
  ];
  types: [
    {
      name: "agent";
      type: {
        kind: "struct";
        fields: [
          { name: "owner"; type: "pubkey" },
          { name: "metadataUri"; type: "string" },
          { name: "hourlyRate"; type: "u64" },
          { name: "reputation"; type: "u64" },
          { name: "bountiesCompleted"; type: "u64" },
          { name: "totalEarned"; type: "u64" },
          { name: "availability"; type: "u8" },
          { name: "bump"; type: "u8" },
          { name: "createdAt"; type: "i64" }
        ];
      };
    }
  ];
  errors: [
    { code: 6000; name: "UriTooLong"; msg: "Metadata URI exceeds maximum length of 200 characters" },
    { code: 6001; name: "InvalidHourlyRate"; msg: "Hourly rate must be greater than 0" },
    { code: 6002; name: "InvalidAvailability"; msg: "Availability must be 0 (Available), 1 (Busy), or 2 (Offline)" },
    { code: 6003; name: "InvalidRating"; msg: "Rating must be between 1 and 500 (fixed-point * 100)" }
  ];
};

export const IDL: AgentRegistry = {
  version: "0.1.0",
  name: "agent_registry",
  address: "DiLuZ4JcnyFcE6FttH5NryQJrM2KKewy2Z8oDk9iJXNF",
  metadata: { name: "agent_registry", version: "0.1.0", spec: "0.1.0" },
  instructions: [
    {
      name: "registerAgent",
      discriminator: [135, 157, 66, 195, 2, 113, 175, 30],
      accounts: [
        { name: "agent", writable: true },
        { name: "owner", writable: true, signer: true },
        { name: "systemProgram" },
      ],
      args: [
        { name: "metadataUri", type: "string" },
        { name: "hourlyRate", type: "u64" },
      ],
    },
    {
      name: "updateAgent",
      discriminator: [85, 2, 178, 9, 119, 139, 102, 164],
      accounts: [
        { name: "agent", writable: true },
        { name: "owner", signer: true },
      ],
      args: [
        { name: "metadataUri", type: { option: "string" } },
        { name: "hourlyRate", type: { option: "u64" } },
        { name: "availability", type: { option: "u8" } },
      ],
    },
    {
      name: "updateReputation",
      discriminator: [194, 220, 43, 201, 54, 209, 49, 178],
      accounts: [
        { name: "agent", writable: true },
        { name: "authority", signer: true },
      ],
      args: [{ name: "newRating", type: "u64" }],
    },
    {
      name: "addEarnings",
      discriminator: [33, 238, 51, 61, 134, 44, 42, 111],
      accounts: [
        { name: "agent", writable: true },
        { name: "authority", signer: true },
      ],
      args: [{ name: "amount", type: "u64" }],
    },
  ],
  accounts: [
    {
      name: "agent",
      discriminator: [47, 166, 112, 147, 155, 197, 86, 7],
    },
  ],
  types: [
    {
      name: "agent",
      type: {
        kind: "struct",
        fields: [
          { name: "owner", type: "pubkey" },
          { name: "metadataUri", type: "string" },
          { name: "hourlyRate", type: "u64" },
          { name: "reputation", type: "u64" },
          { name: "bountiesCompleted", type: "u64" },
          { name: "totalEarned", type: "u64" },
          { name: "availability", type: "u8" },
          { name: "bump", type: "u8" },
          { name: "createdAt", type: "i64" },
        ],
      },
    },
  ],
  errors: [
    { code: 6000, name: "UriTooLong", msg: "Metadata URI exceeds maximum length of 200 characters" },
    { code: 6001, name: "InvalidHourlyRate", msg: "Hourly rate must be greater than 0" },
    { code: 6002, name: "InvalidAvailability", msg: "Availability must be 0 (Available), 1 (Busy), or 2 (Offline)" },
    { code: 6003, name: "InvalidRating", msg: "Rating must be between 1 and 500 (fixed-point * 100)" },
  ],
};
