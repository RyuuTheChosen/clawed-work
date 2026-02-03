export type BountyEscrow = {
  version: "0.1.0";
  name: "bounty_escrow";
  address: string;
  metadata: { name: string; version: string; spec: string };
  instructions: [
    {
      name: "initClient";
      discriminator: number[];
      accounts: [
        { name: "clientState"; writable: true },
        { name: "client"; writable: true; signer: true },
        { name: "systemProgram" }
      ];
      args: [];
    },
    {
      name: "createBounty";
      discriminator: number[];
      accounts: [
        { name: "clientState"; writable: true },
        { name: "bounty"; writable: true },
        { name: "vault"; writable: true },
        { name: "client"; writable: true; signer: true },
        { name: "clientTokenAccount"; writable: true },
        { name: "usdcMint" },
        { name: "tokenProgram" },
        { name: "systemProgram" },
        { name: "rent" }
      ];
      args: [
        { name: "metadataUri"; type: "string" },
        { name: "budget"; type: "u64" },
        { name: "deadline"; type: "i64" }
      ];
    },
    {
      name: "claimBounty";
      discriminator: number[];
      accounts: [
        { name: "bounty"; writable: true },
        { name: "agent"; signer: true }
      ];
      args: [];
    },
    {
      name: "submitWork";
      discriminator: number[];
      accounts: [
        { name: "bounty"; writable: true },
        { name: "agent"; signer: true }
      ];
      args: [{ name: "deliverableUri"; type: "string" }];
    },
    {
      name: "approveWork";
      discriminator: number[];
      accounts: [
        { name: "bounty"; writable: true },
        { name: "vault"; writable: true },
        { name: "agentTokenAccount"; writable: true },
        { name: "client"; signer: true },
        { name: "tokenProgram" }
      ];
      args: [];
    },
    {
      name: "disputeBounty";
      discriminator: number[];
      accounts: [
        { name: "bounty"; writable: true },
        { name: "authority"; signer: true }
      ];
      args: [];
    },
    {
      name: "cancelBounty";
      discriminator: number[];
      accounts: [
        { name: "bounty"; writable: true },
        { name: "vault"; writable: true },
        { name: "clientTokenAccount"; writable: true },
        { name: "client"; writable: true; signer: true },
        { name: "tokenProgram" }
      ];
      args: [];
    },
    {
      name: "leaveReview";
      discriminator: number[];
      accounts: [
        { name: "bounty" },
        { name: "review"; writable: true },
        { name: "client"; writable: true; signer: true },
        { name: "systemProgram" }
      ];
      args: [
        { name: "rating"; type: "u64" },
        { name: "commentUri"; type: "string" }
      ];
    }
  ];
  accounts: [
    { name: "clientState"; discriminator: number[] },
    { name: "bounty"; discriminator: number[] },
    { name: "review"; discriminator: number[] }
  ];
  types: [
    {
      name: "clientState";
      type: {
        kind: "struct";
        fields: [
          { name: "owner"; type: "pubkey" },
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
          { name: "client"; type: "pubkey" },
          { name: "bountyId"; type: "u64" },
          { name: "metadataUri"; type: "string" },
          { name: "budget"; type: "u64" },
          { name: "deadline"; type: "i64" },
          { name: "status"; type: "u8" },
          { name: "claims"; type: "u64" },
          { name: "assignedAgent"; type: "pubkey" },
          { name: "deliverableUri"; type: "string" },
          { name: "vault"; type: "pubkey" },
          { name: "usdcMint"; type: "pubkey" },
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
          { name: "bounty"; type: "pubkey" },
          { name: "reviewer"; type: "pubkey" },
          { name: "agent"; type: "pubkey" },
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
      discriminator: [30, 50, 186, 118, 60, 68, 27, 155],
      accounts: [
        { name: "clientState", writable: true },
        { name: "client", writable: true, signer: true },
        { name: "systemProgram" },
      ],
      args: [],
    },
    {
      name: "createBounty",
      discriminator: [122, 90, 14, 143, 8, 125, 200, 2],
      accounts: [
        { name: "clientState", writable: true },
        { name: "bounty", writable: true },
        { name: "vault", writable: true },
        { name: "client", writable: true, signer: true },
        { name: "clientTokenAccount", writable: true },
        { name: "usdcMint" },
        { name: "tokenProgram" },
        { name: "systemProgram" },
        { name: "rent" },
      ],
      args: [
        { name: "metadataUri", type: "string" },
        { name: "budget", type: "u64" },
        { name: "deadline", type: "i64" },
      ],
    },
    {
      name: "claimBounty",
      discriminator: [225, 157, 163, 238, 239, 169, 75, 226],
      accounts: [
        { name: "bounty", writable: true },
        { name: "agent", signer: true },
      ],
      args: [],
    },
    {
      name: "submitWork",
      discriminator: [158, 80, 101, 51, 114, 130, 101, 253],
      accounts: [
        { name: "bounty", writable: true },
        { name: "agent", signer: true },
      ],
      args: [{ name: "deliverableUri", type: "string" }],
    },
    {
      name: "approveWork",
      discriminator: [181, 118, 45, 143, 204, 88, 237, 109],
      accounts: [
        { name: "bounty", writable: true },
        { name: "vault", writable: true },
        { name: "agentTokenAccount", writable: true },
        { name: "client", signer: true },
        { name: "tokenProgram" },
      ],
      args: [],
    },
    {
      name: "disputeBounty",
      discriminator: [240, 83, 213, 95, 60, 48, 48, 29],
      accounts: [
        { name: "bounty", writable: true },
        { name: "authority", signer: true },
      ],
      args: [],
    },
    {
      name: "cancelBounty",
      discriminator: [79, 65, 107, 143, 128, 165, 135, 46],
      accounts: [
        { name: "bounty", writable: true },
        { name: "vault", writable: true },
        { name: "clientTokenAccount", writable: true },
        { name: "client", writable: true, signer: true },
        { name: "tokenProgram" },
      ],
      args: [],
    },
    {
      name: "leaveReview",
      discriminator: [117, 81, 110, 222, 0, 51, 250, 47],
      accounts: [
        { name: "bounty" },
        { name: "review", writable: true },
        { name: "client", writable: true, signer: true },
        { name: "systemProgram" },
      ],
      args: [
        { name: "rating", type: "u64" },
        { name: "commentUri", type: "string" },
      ],
    },
  ],
  accounts: [
    { name: "clientState", discriminator: [147, 10, 249, 80, 145, 124, 219, 60] },
    { name: "bounty", discriminator: [237, 16, 105, 198, 19, 69, 242, 234] },
    { name: "review", discriminator: [124, 63, 203, 215, 226, 30, 222, 15] },
  ],
  types: [
    {
      name: "clientState",
      type: {
        kind: "struct",
        fields: [
          { name: "owner", type: "pubkey" },
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
          { name: "client", type: "pubkey" },
          { name: "bountyId", type: "u64" },
          { name: "metadataUri", type: "string" },
          { name: "budget", type: "u64" },
          { name: "deadline", type: "i64" },
          { name: "status", type: "u8" },
          { name: "claims", type: "u64" },
          { name: "assignedAgent", type: "pubkey" },
          { name: "deliverableUri", type: "string" },
          { name: "vault", type: "pubkey" },
          { name: "usdcMint", type: "pubkey" },
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
          { name: "bounty", type: "pubkey" },
          { name: "reviewer", type: "pubkey" },
          { name: "agent", type: "pubkey" },
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
