import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// ─── Translations ─────────────────────────────────────────────────────────────
const resources = {
  'pt-BR': {
    translation: {
      // Navigation
      nav: {
        home: 'Início',
        shop: 'Loja',
        categories: 'Categorias',
        deals: 'Ofertas',
        about: 'Sobre',
        cart: 'Carrinho',
        wishlist: 'Favoritos',
        profile: 'Perfil',
        orders: 'Pedidos',
        settings: 'Configurações',
        logout: 'Sair',
        login: 'Entrar',
        register: 'Criar conta',
        admin: 'Painel Admin',
        support: 'Suporte',
      },
      // Auth
      auth: {
        email: 'E-mail',
        password: 'Senha',
        username: 'Nome de usuário',
        firstName: 'Nome',
        lastName: 'Sobrenome',
        loginTitle: 'Bem-vindo de volta',
        loginSubtitle: 'Entre na sua conta',
        registerTitle: 'Criar conta',
        registerSubtitle: 'Junte-se a milhares de compradores',
        forgotPassword: 'Esqueceu a senha?',
        resetPassword: 'Redefinir senha',
        noAccount: 'Não tem uma conta?',
        hasAccount: 'Já tem uma conta?',
        orContinueWith: 'ou continue com',
        verifyEmail: 'Verifique seu e-mail',
        twoFactor: 'Autenticação em dois fatores',
        twoFactorCode: 'Código de verificação',
        backupCode: 'Usar código de backup',
        rememberMe: 'Lembrar-me',
        agreeTerms: 'Concordo com os Termos de Uso e Política de Privacidade',
      },
      // Shop
      shop: {
        search: 'Buscar produtos...',
        filter: 'Filtrar',
        sortBy: 'Ordenar por',
        newest: 'Mais recentes',
        priceAsc: 'Menor preço',
        priceDesc: 'Maior preço',
        bestSelling: 'Mais vendidos',
        bestRated: 'Melhor avaliados',
        addToCart: 'Adicionar ao carrinho',
        addedToCart: 'Adicionado!',
        buyNow: 'Comprar agora',
        outOfStock: 'Esgotado',
        wishlist: 'Favoritar',
        share: 'Compartilhar',
        category: 'Categoria',
        brand: 'Marca',
        price: 'Preço',
        rating: 'Avaliação',
        reviews: 'avaliações',
        noProducts: 'Nenhum produto encontrado',
        digital: 'Digital',
        free: 'Grátis',
        inStock: 'Em estoque',
        fewLeft: 'Poucas unidades',
        viewAll: 'Ver todos',
        recommended: 'Recomendados para você',
        featured: 'Destaques',
        newArrivals: 'Novidades',
        bestsellers: 'Mais vendidos',
      },
      // Product
      product: {
        description: 'Descrição',
        specifications: 'Especificações',
        reviews: 'Avaliações',
        related: 'Produtos relacionados',
        quantity: 'Quantidade',
        sku: 'SKU',
        shippingInfo: 'Informações de entrega',
        returnPolicy: 'Política de devolução',
        writeReview: 'Escrever avaliação',
        noReviews: 'Seja o primeiro a avaliar',
        verifiedPurchase: 'Compra verificada',
      },
      // Cart
      cart: {
        title: 'Carrinho',
        empty: 'Seu carrinho está vazio',
        emptyDesc: 'Adicione produtos para continuar',
        continueShopping: 'Continuar comprando',
        subtotal: 'Subtotal',
        shipping: 'Frete',
        discount: 'Desconto',
        total: 'Total',
        checkout: 'Finalizar compra',
        coupon: 'Cupom de desconto',
        applyCoupon: 'Aplicar',
        removeCoupon: 'Remover',
        free: 'Grátis',
        items: '{{count}} item',
        items_plural: '{{count}} itens',
      },
      // Orders
      orders: {
        title: 'Meus pedidos',
        empty: 'Você não tem pedidos',
        number: 'Pedido #{{number}}',
        status: {
          PENDING: 'Aguardando',
          PAYMENT_PROCESSING: 'Processando pagamento',
          PAID: 'Pago',
          PREPARING: 'Preparando',
          SHIPPED: 'Enviado',
          DELIVERED: 'Entregue',
          CANCELLED: 'Cancelado',
          REFUNDED: 'Reembolsado',
        },
        trackOrder: 'Rastrear pedido',
        viewDetails: 'Ver detalhes',
        reorder: 'Repetir pedido',
        cancelOrder: 'Cancelar pedido',
      },
      // Common
      common: {
        loading: 'Carregando...',
        error: 'Erro inesperado',
        tryAgain: 'Tentar novamente',
        save: 'Salvar',
        cancel: 'Cancelar',
        delete: 'Excluir',
        edit: 'Editar',
        confirm: 'Confirmar',
        close: 'Fechar',
        back: 'Voltar',
        next: 'Próximo',
        previous: 'Anterior',
        submit: 'Enviar',
        search: 'Buscar',
        clear: 'Limpar',
        apply: 'Aplicar',
        required: 'Obrigatório',
        optional: 'Opcional',
        yes: 'Sim',
        no: 'Não',
        or: 'ou',
        and: 'e',
        learnMore: 'Saiba mais',
        seeAll: 'Ver todos',
        copied: 'Copiado!',
        copy: 'Copiar',
      },
      // Support
      support: {
        title: 'Suporte',
        newTicket: 'Novo ticket',
        myTickets: 'Meus tickets',
        faq: 'Perguntas frequentes',
        chat: 'Chat ao vivo',
        subject: 'Assunto',
        message: 'Mensagem',
        priority: 'Prioridade',
        status: {
          OPEN: 'Aberto',
          IN_PROGRESS: 'Em andamento',
          RESOLVED: 'Resolvido',
          CLOSED: 'Fechado',
        },
      },
    },
  },
  'en': {
    translation: {
      nav: {
        home: 'Home', shop: 'Shop', categories: 'Categories', deals: 'Deals',
        about: 'About', cart: 'Cart', wishlist: 'Wishlist', profile: 'Profile',
        orders: 'Orders', settings: 'Settings', logout: 'Logout', login: 'Login',
        register: 'Sign up', admin: 'Admin Panel', support: 'Support',
      },
      auth: {
        email: 'Email', password: 'Password', username: 'Username',
        firstName: 'First name', lastName: 'Last name',
        loginTitle: 'Welcome back', loginSubtitle: 'Sign in to your account',
        registerTitle: 'Create account', registerSubtitle: 'Join thousands of shoppers',
        forgotPassword: 'Forgot password?', resetPassword: 'Reset password',
        noAccount: "Don't have an account?", hasAccount: 'Already have an account?',
        orContinueWith: 'or continue with', verifyEmail: 'Verify your email',
        twoFactor: 'Two-factor authentication', twoFactorCode: 'Verification code',
        backupCode: 'Use backup code', rememberMe: 'Remember me',
        agreeTerms: 'I agree to the Terms of Service and Privacy Policy',
      },
      shop: {
        search: 'Search products...', filter: 'Filter', sortBy: 'Sort by',
        newest: 'Newest', priceAsc: 'Price: Low to High', priceDesc: 'Price: High to Low',
        bestSelling: 'Best selling', bestRated: 'Best rated',
        addToCart: 'Add to cart', addedToCart: 'Added!', buyNow: 'Buy now',
        outOfStock: 'Out of stock', wishlist: 'Wishlist', share: 'Share',
        category: 'Category', brand: 'Brand', price: 'Price', rating: 'Rating',
        reviews: 'reviews', noProducts: 'No products found', digital: 'Digital',
        free: 'Free', inStock: 'In stock', fewLeft: 'Few left',
        viewAll: 'View all', recommended: 'Recommended for you',
        featured: 'Featured', newArrivals: 'New arrivals', bestsellers: 'Bestsellers',
      },
      orders: {
        title: 'My orders', empty: 'You have no orders',
        number: 'Order #{{number}}',
        status: {
          PENDING: 'Pending', PAYMENT_PROCESSING: 'Processing payment',
          PAID: 'Paid', PREPARING: 'Preparing', SHIPPED: 'Shipped',
          DELIVERED: 'Delivered', CANCELLED: 'Cancelled', REFUNDED: 'Refunded',
        },
        trackOrder: 'Track order', viewDetails: 'View details',
        reorder: 'Reorder', cancelOrder: 'Cancel order',
      },
      common: {
        loading: 'Loading...', error: 'Unexpected error', tryAgain: 'Try again',
        save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit',
        confirm: 'Confirm', close: 'Close', back: 'Back', next: 'Next',
        previous: 'Previous', submit: 'Submit', search: 'Search', clear: 'Clear',
        apply: 'Apply', required: 'Required', optional: 'Optional',
        yes: 'Yes', no: 'No', or: 'or', and: 'and', learnMore: 'Learn more',
        seeAll: 'See all', copied: 'Copied!', copy: 'Copy',
      },
    },
  },
  'es': {
    translation: {
      nav: {
        home: 'Inicio', shop: 'Tienda', categories: 'Categorías', deals: 'Ofertas',
        about: 'Sobre', cart: 'Carrito', wishlist: 'Favoritos', profile: 'Perfil',
        orders: 'Pedidos', settings: 'Configuración', logout: 'Salir', login: 'Entrar',
        register: 'Crear cuenta', admin: 'Panel Admin', support: 'Soporte',
      },
      common: {
        loading: 'Cargando...', save: 'Guardar', cancel: 'Cancelar', delete: 'Eliminar',
      },
    },
  },
  'fr': {
    translation: {
      nav: {
        home: 'Accueil', shop: 'Boutique', cart: 'Panier', login: 'Connexion',
        register: 'Créer un compte', logout: 'Déconnexion',
      },
    },
  },
  'ja': {
    translation: {
      nav: {
        home: 'ホーム', shop: 'ショップ', cart: 'カート', login: 'ログイン',
        register: 'アカウント作成', logout: 'ログアウト',
      },
    },
  },
  'de': {
    translation: {
      nav: {
        home: 'Startseite', shop: 'Shop', cart: 'Warenkorb', login: 'Anmelden',
        register: 'Konto erstellen', logout: 'Abmelden',
      },
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'pt-BR',
    supportedLngs: ['pt-BR', 'en', 'es', 'fr', 'ja', 'de'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  });

export default i18n;

// ─── Language metadata ─────────────────────────────────────────────────────────
export const LANGUAGES = [
  { code: 'pt-BR', name: 'Português', flag: '🇧🇷', nativeName: 'Português (BR)' },
  { code: 'en', name: 'English', flag: '🇺🇸', nativeName: 'English' },
  { code: 'es', name: 'Español', flag: '🇪🇸', nativeName: 'Español' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', nativeName: 'Français' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵', nativeName: '日本語' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', nativeName: 'Deutsch' },
] as const;

export type SupportedLanguage = (typeof LANGUAGES)[number]['code'];
