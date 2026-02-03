export type AgentRegistry = {
  version: "0.1.0";
  name: "agent_registry";
  address: string;
  metadata: { name: string; version: string; spec: string };
  instructions: [
    {
      name: "registerAgent";
      accounts: [
        { name: "agent"; isMut: true; isSigner: false },
        { name: "owner"; isMut: true; isSigner: true },
        { name: "systemProgram"; isMut: false; isSigner: false }
      ];
      args: [
        { name: "metadataUri"; type: "string" },
        { name: "hourlyRate"; type: "u64" }
      ];
    },
    {
      name: "updateAgent";
      accounts: [
        { name: "agent"; isMut: true; isSigner: false },
        { name: "owner"; isMut: false; isSigner: true }
      ];
      args: [
        { name: "metadataUri"; type: { option: "string" } },
        { name: "hourlyRate"; type: { option: "u64" } },
        { name: "availability"; type: { option: "u8" } }
      ];
    },
    {
      name: "updateReputation";
      accounts: [
        { name: "agent"; isMut: true; isSigner: false },
        { name: "authority"; isMut: false; isSigner: true }
      ];
      args: [{ name: "newRating"; type: "u64" }];
    },
    {
      name: "addEarnings";
      accounts: [
        { name: "agent"; isMut: true; isSigner: false },
        { name: "authority"; isMut: false; isSigner: true }
      ];
      args: [{ name: "amount"; type: "u64" }];
    }
  ];
  accounts: [
    {
      name: "agent";
      type: {
        kind: "struct";
        fields: [
          { name: "owner"; type: "publicKey" },
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
      accounts: [
        { name: "agent", isMut: true, isSigner: false },
        { name: "owner", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [
        { name: "metadataUri", type: "string" },
        { name: "hourlyRate", type: "u64" },
      ],
    },
    {
      name: "updateAgent",
      accounts: [
        { name: "agent", isMut: true, isSigner: false },
        { name: "owner", isMut: false, isSigner: true },
      ],
      args: [
        { name: "metadataUri", type: { option: "string" } },
        { name: "hourlyRate", type: { option: "u64" } },
        { name: "availability", type: { option: "u8" } },
      ],
    },
    {
      name: "updateReputation",
      accounts: [
        { name: "agent", isMut: true, isSigner: false },
        { name: "authority", isMut: false, isSigner: true },
      ],
      args: [{ name: "newRating", type: "u64" }],
    },
    {
      name: "addEarnings",
      accounts: [
        { name: "agent", isMut: true, isSigner: false },
        { name: "authority", isMut: false, isSigner: true },
      ],
      args: [{ name: "amount", type: "u64" }],
    },
  ],
  accounts: [
    {
      name: "agent",
      type: {
        kind: "struct",
        fields: [
          { name: "owner", type: "publicKey" },
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
