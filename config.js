// Configuración centralizada para AWS
// Esta variable detecta automáticamente si estás en localhost o en S3/CloudFront
const currentOrigin = window.location.origin;

const CONFIG = {
    // URL de tu backend en EC2. Como ya usamos nip.io con HTTPS, NO necesitas cambiar esto al subir a S3.
    API_URL: 'https://52.200.111.100.nip.io', 
    
    // --- AWS COGNITO CONFIGURATION ---
    // Si algún día creas otro User Pool o usas otra cuenta de AWS, cambia estos valores:
    COGNITO_REGION: 'us-east-1',
    COGNITO_USER_POOL_ID: 'us-east-1_gXHISpjx9', // Cambiar si creas un User Pool nuevo
    COGNITO_CLIENT_ID: '6bnufkn09clee3f90m1uo38ev2', // Cambiar si creas una nueva App Client
    COGNITO_DOMAIN: 'https://us-east-1gxhispjx9.auth.us-east-1.amazoncognito.com',

    // --- AL SUBIR A S3 / CLOUDFRONT ---
    // El frontend detectará solo la URL, pero TÚ DEBES ir a la consola de AWS Cognito y agregar
    // LA URL EXACTA de tu CloudFront (ej: https://d12345.cloudfront.net/index.html) a la lista de:
    // 1. "Orígenes de devolución de llamada permitidos" (Allowed callback URLs)
    // 2. "Orígenes de cierre de sesión permitidos" (Allowed sign-out URLs)
    COGNITO_REDIRECT_URI: `${currentOrigin}/index.html`,
    COGNITO_LOGOUT_URI: `${currentOrigin}/index.html`,
    
    COGNITO_SCOPES: 'email openid profile',
    //IS_LOCAL: currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1')
};
export default CONFIG;
