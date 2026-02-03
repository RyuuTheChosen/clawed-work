export type BountyEscrow = {
  version: "0.1.0";
  name: "bounty_escrow";
  address: string;
  metadata: { name: string; version: string; spec: string };
  instructions: [
    {
      name: "initClient";
      accounts: [
        { name: "clientState"; isMut: true; isSigner: false },
        { name: "client"; isMut: true; isSigner: true },
        { name: "systemProgram"; isMut: false; isSigner: false }
      ];
      args: [];
    },
    {
      name: "createBounty";
      accounts: [
        { name: "clientState"; isMut: true; isSigner: false },
        { name: "bounty"; isMut: true; isSigner: false },
        { name: "vault"; isMut: true; isSigner: false },
        { name: "client"; isMut: true; isSigner: true },
        { name: "clientTokenAccount"; isMut: true; isSigner: false },
        { name: "usdcMint"; isMut: false; isSigner: false },
        { name: "tokenProgram"; isMut: false; isSigner: false },
        { name: "systemProgram"; isMut: false; isSigner: false },
        { name: "rent"; isMut: false; isSigner: false }
      ];
      args: [
        { name: "metadataUri"; type: "string" },
        { name: "budget"; type: "u64" },
        { name: "deadline"; type: "i64" }
      ];
    },
    {
      name: "claimBounty";
      accounts: [
        { name: "bounty"; isMut: true; isSigner: false },
        { name: "agent"; isMut: false; isSigner: true }
      ];
      args: [];
    },
    {
      name: "submitWork";
      accounts: [
        { name: "bounty"; isMut: true; isSigner: false },
        { name: "agent"; isMut: false; isSigner: true }
      ];
      args: [{ name: "deliverableUri"; type: "string" }];
    },
    {
      name: "approveWork";
      accounts: [
        { name: "bounty"; isMut: true; isSigner: false },
        { name: "vault"; isMut: true; isSigner: false },
        { name: "agentTokenAccount"; isMut: true; isSigner: false },
        { name: "client"; isMut: false; isSigner: true },
        { name: "tokenProgram"; isMut: false; isSigner: false }
      ];
      args: [];
    },
    {
      name: "disputeBounty";
      accounts: [
        { name: "bounty"; isMut: true; isSigner: false },
        { name: "authority"; isMut: false; isSigner: true }
      ];
      args: [];
    },
    {
      name: "cancelBounty";
      accounts: [
        { name: "bounty"; isMut: true; isSigner: false },
        { name: "vault"; isMut: true; isSigner: false },
        { name: "clientTokenAccount"; isMut: true; isSigner: false },
        { name: "client"; isMut: true; isSigner: true },
        { name: "tokenProgram"; isMut: false; isSigner: false }
      ];
      args: [];
    },
    {
      name: "leaveReview";
      accounts: [
        { name: "bounty"; isMut: false; isSigner: false },
        { name: "review"; isMut: true; isSigner: false },
        { name: "client"; isMut: true; isSigner: true },
        { name: "systemProgram"; isMut: false; isSigner: false }
      ];
      args: [
        { name: "rating"; type: "u64" },
        { name: "commentUri"; type: "string" }
      ];
    }
  ];
  accounts: [
    {
      name: "clientState";
      type: {
        kind: "struct";
        fields: [
          { name: "owner"; type: "publicKey" },
          { name: "bountyCount"; type: "u64" },
          { name: "bump"; type: "u8" }
        ];
      };
    },
    {
      name: "bounty";
      type: {
        kind: "struct";
        fields: [
          { name: "client"; type: "publicKey" },
          { name: "bountyId"; type: "u64" },
          { name: "metadataUri"; type: "string" },
          { name: "budget"; type: "u64" },
          { name: "deadline"; type: "i64" },
          { name: "status"; type: "u8" },
          { name: "claims"; type: "u64" },
          { name: "assignedAgent"; type: "publicKey" },
          { name: "deliverableUri"; type: "string" },
          { name: "vault"; type: "publicKey" },
          { name: "usdcMint"; type: "publicKey" },
          { name: "bump"; type: "u8" },
          { name: "createdAt"; type: "i64" }
        ];
      };
    },
    {
      name: "review";
      type: {
        kind: "struct";
        fields: [
          { name: "bounty"; type: "publicKey" },
          { name: "reviewer"; type: "publicKey" },
          { name: "agent"; type: "publicKey" },
          { name: "rating"; type: "u64" },
          { name: "commentUri"; type: "string" },
          { name: "bump"; type: "u8" },
          { name: "createdAt"; type: "i64" }
        ];
      };
    }
  ];
  errors: [
    { code: 6000; name: "UriTooLong"; msg: "Metadata URI exceeds maximum length" },
    { code: 6001; name: "InvalidBudget"; msg: "Budget must be greater than 0" },
    { code: 6002; name: "DeadlinePassed"; msg: "Deadline must be in the future" },
    { code: 6003; name: "NotOpen"; msg: "Bounty is not open" },
    { code: 6004; name: "NotClaimed"; msg: "Bounty is not in claimed state" },
    { code: 6005; name: "NotDelivered"; msg: "Bounty is not in delivered state" },
    { code: 6006; name: "NotAssignedAgent"; msg: "Only the assigned agent can perform this action" },
    { code: 6007; name: "Unauthorized"; msg: "Unauthorized" },
    { code: 6008; name: "CannotDispute"; msg: "Cannot dispute bounty in current state" },
    { code: 6009; name: "InvalidRating"; msg: "Rating must be between 1 and 500" },
    { code: 6010; name: "NotCompleted"; msg: "Bounty is not in completed state" }
  ];
};

export const IDL: BountyEscrow = {
  version: "0.1.0",
  name: "bounty_escrow",
  address: "2KY4RJwdYKnnDMU4WcuwgU2f8B7JoxjdKaTYL953AKb5",
  metadata: { name: "bounty_escrow", version: "0.1.0", spec: "0.1.0" },
  instructions: [
    {
      name: "initClient",
      accounts: [
        { name: "clientState", isMut: true, isSigner: false },
        { name: "client", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [],
    },
    {
      name: "createBounty",
      accounts: [
        { name: "clientState", isMut: true, isSigner: false },
        { name: "bounty", isMut: true, isSigner: false },
        { name: "vault", isMut: true, isSigner: false },
        { name: "client", isMut: true, isSigner: true },
        { name: "clientTokenAccount", isMut: true, isSigner: false },
        { name: "usdcMint", isMut: false, isSigner: false },
        { name: "tokenProgram", isMut: false, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
        { name: "rent", isMut: false, isSigner: false },
      ],
      args: [
        { name: "metadataUri", type: "string" },
        { name: "budget", type: "u64" },
        { name: "deadline", type: "i64" },
      ],
    },
    {
      name: "claimBounty",
      accounts: [
        { name: "bounty", isMut: true, isSigner: false },
        { name: "agent", isMut: false, isSigner: true },
      ],
      args: [],
    },
    {
      name: "submitWork",
      accounts: [
        { name: "bounty", isMut: true, isSigner: false },
        { name: "agent", isMut: false, isSigner: true },
      ],
      args: [{ name: "deliverableUri", type: "string" }],
    },
    {
      name: "approveWork",
      accounts: [
        { name: "bounty", isMut: true, isSigner: false },
        { name: "vault", isMut: true, isSigner: false },
        { name: "agentTokenAccount", isMut: true, isSigner: false },
        { name: "client", isMut: false, isSigner: true },
        { name: "tokenProgram", isMut: false, isSigner: false },
      ],
      args: [],
    },
    {
      name: "disputeBounty",
      accounts: [
        { name: "bounty", isMut: true, isSigner: false },
        { name: "authority", isMut: false, isSigner: true },
      ],
      args: [],
    },
    {
      name: "cancelBounty",
      accounts: [
        { name: "bounty", isMut: true, isSigner: false },
        { name: "vault", isMut: true, isSigner: false },
        { name: "clientTokenAccount", isMut: true, isSigner: false },
        { name: "client", isMut: true, isSigner: true },
        { name: "tokenProgram", isMut: false, isSigner: false },
      ],
      args: [],
    },
    {
      name: "leaveReview",
      accounts: [
        { name: "bounty", isMut: false, isSigner: false },
        { name: "review", isMut: true, isSigner: false },
        { name: "client", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [
        { name: "rating", type: "u64" },
        { name: "commentUri", type: "string" },
      ],
    },
  ],
  accounts: [
    {
      name: "clientState",
      type: {
        kind: "struct",
        fields: [
          { name: "owner", type: "publicKey" },
          { name: "bountyCount", type: "u64" },
          { name: "bump", type: "u8" },
        ],
      },
    },
    {
      name: "bounty",
      type: {
        kind: "struct",
        fields: [
          { name: "client", type: "publicKey" },
          { name: "bountyId", type: "u64" },
          { name: "metadataUri", type: "string" },
          { name: "budget", type: "u64" },
          { name: "deadline", type: "i64" },
          { name: "status", type: "u8" },
          { name: "claims", type: "u64" },
          { name: "assignedAgent", type: "publicKey" },
          { name: "deliverableUri", type: "string" },
          { name: "vault", type: "publicKey" },
          { name: "usdcMint", type: "publicKey" },
          { name: "bump", type: "u8" },
          { name: "createdAt", type: "i64" },
        ],
      },
    },
    {
      name: "review",
      type: {
        kind: "struct",
        fields: [
          { name: "bounty", type: "publicKey" },
          { name: "reviewer", type: "publicKey" },
          { name: "agent", type: "publicKey" },
          { name: "rating", type: "u64" },
          { name: "commentUri", type: "string" },
          { name: "bump", type: "u8" },
          { name: "createdAt", type: "i64" },
        ],
      },
    },
  ],
  errors: [
    { code: 6000, name: "UriTooLong", msg: "Metadata URI exceeds maximum length" },
    { code: 6001, name: "InvalidBudget", msg: "Budget must be greater than 0" },
    { code: 6002, name: "DeadlinePassed", msg: "Deadline must be in the future" },
    { code: 6003, name: "NotOpen", msg: "Bounty is not open" },
    { code: 6004, name: "NotClaimed", msg: "Bounty is not in claimed state" },
    { code: 6005, name: "NotDelivered", msg: "Bounty is not in delivered state" },
    { code: 6006, name: "NotAssignedAgent", msg: "Only the assigned agent can perform this action" },
    { code: 6007, name: "Unauthorized", msg: "Unauthorized" },
    { code: 6008, name: "CannotDispute", msg: "Cannot dispute bounty in current state" },
    { code: 6009, name: "InvalidRating", msg: "Rating must be between 1 and 500" },
    { code: 6010, name: "NotCompleted", msg: "Bounty is not in completed state" },
  ],
};
