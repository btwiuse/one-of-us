const required = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing env: ${key}`);
  }
  return value;
};

const optional = (key: string, defaultValue: string): string => {
  return process.env[key] || defaultValue;
};

export const ENV = {
  ROUTER_ADDRESS: required('NEXT_PUBLIC_ROUTER_ADDRESS') as `0x${string}`,
  PROGRAM_ID: required('NEXT_PUBLIC_PROGRAM_ID') as `0x${string}`,
  WVARA_ADDRESS: required('NEXT_PUBLIC_WVARA_ADDRESS') as `0x${string}`,
  VARA_ETH_WS: required('NEXT_PUBLIC_VARA_ETH_WS'),
  VARA_ETH_HTTP: optional(
    'NEXT_PUBLIC_VARA_ETH_HTTP',
    'https://hoodi-reth-rpc.gear-tech.io'
  ),
  API_URL: optional('NEXT_PUBLIC_API_URL', '/one-of-us'),
} as const;
