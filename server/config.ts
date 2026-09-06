export const config = {
    privyAppId: required("PRIVY_APP_ID"),
    privyAppSecret: required("PRIVY_APP_SECRET"),
    authorizationPrivateKey: required(
      "PRIVY_AUTHORIZATION_PRIVATE_KEY",
    ),
  
    contributionContract: required(
      "CONTRIBUTION_CONTRACT_ADDRESS",
    ) as `0x${string}`,
  
    cronSecret: process.env.CRON_SECRET ?? "",
  
    chainId: 84532,
    caip2: "eip155:84532",
  
    contributionWei: 1_000_000_000_000_000n,
  
    policyExpiry: 1798675200,
  };
  
  function required(name: string): string {
    const value = process.env[name];
  
    if (!value) {
      throw new Error(`Missing required environment variable: ${name}`);
    }
  
    return value;
  }