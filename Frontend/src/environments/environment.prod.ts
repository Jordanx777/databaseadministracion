import packageInfo from '../../package.json';

export const environment = {
  appVersion: packageInfo.version,
  production: true,
  apiUrl: 'https://inventario-backend-wrir.onrender.com/api/',
  imagesUrl: 'https://inventario-backend-wrir.onrender.com',
};
