export enum Enviornments {
  local,
  dev,
  production,
}

const souvik = '192.168.31.72'

export const URLs = {
  [Enviornments.local]: {
    apiURL: `http://${souvik}:8000/app_api/`,
  },
  [Enviornments.dev]: {
    apiURL: 'https://api.assets.durbin.co.in',
  },
  [Enviornments.production]: {
    apiURL: '',
  },
};



export const enviornment = Enviornments.dev;