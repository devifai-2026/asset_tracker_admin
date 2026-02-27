export enum Enviornments {
  local,
  dev,
  production,
}

const souvik = '192.168.31.72'

//  hello world 

export const URLs = {
  [Enviornments.local]: {
    apiURL: `http://${souvik}:8000/app_api/`,
  },
  [Enviornments.dev]: {
    apiURL: 'https://api.assets.durbin.co.in',
  },
  [Enviornments.production]: {
    apiURL: 'https://api.assets.durbinservices.com',
  },
};



export const enviornment = Enviornments.production;