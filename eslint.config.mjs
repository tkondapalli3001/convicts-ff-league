import coreWebVitals from 'eslint-config-next/core-web-vitals'

const config = [
  ...coreWebVitals,
  {
    ignores: ['out/**', '.next/**', 'node_modules/**', 'scripts/**'],
  },
  {
    rules: {
      // This app's architecture is fetch-then-setState in effects (client-only
      // static export, no server data). These react-hooks v7 rules flag that
      // pattern wholesale — keep them visible as warnings, not errors.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/use-memo': 'warn',
    },
  },
]

export default config
