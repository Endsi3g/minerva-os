import { createContext, useContext, useState } from 'react';

export type Lang = 'en' | 'fr';

const translations = {
  en: {
    nav: {
      brand: 'Minerva',
      items: ['Platform', 'Modules', 'Client Portal', 'Security', 'Insights'] as string[],
      signIn: 'Sign in',
      requestAccess: 'Request Access',
    },
    landing: {
      badge: 'Agency Operating System · V1 Launching Soon',
      headline1: 'Where strategy becomes system',
      headline2: 'and wisdom rewrites how agencies work',
      subtitle1: 'Minerva OS, the operating system for agencies',
      subtitle2: 'that deliver with clarity, precision and intent',
      cta: 'Request Access',
      ctaSecondary: 'Sign in',
      trust: 'Trusted by the most ambitious agencies',
      features: {
        platform: {
          title: 'The Platform',
          desc: 'A central engine for leads, onboarding, and execution. Minerva OS orchestrates your entire agency lifecycle with strategic precision.',
        },
        portal: {
          title: 'Client Portal',
          desc: 'A high-end interface for your clients. Feedback, approvals, and files in a calm, branded environment.',
          cta: 'Explore Portal',
        },
        insights: {
          title: 'Insights',
          desc: 'Predictive analytics and real-time performance tracking. Wisdom derived from every action.',
        },
        security: {
          title: 'Security',
          desc: 'Enterprise-grade protection. Granular permissions and secure asset vaults as standard.',
        },
        automation: {
          title: 'AI Assist',
          desc: 'Intelligent summaries, risk detection, and automated workflows that feel like a second brain.',
        },
      },
      metrics: [
        { label: 'Increase in Profitability', value: '30%', desc: 'Through intelligent resource allocation and predictive mapping.' },
        { label: 'Faster Client Approvals', value: '2x', desc: 'Minimal friction portals designed for decision-makers.' },
        { label: 'Operational Clarity', value: '100%', desc: 'Every lead, project, and deliverable in one unified system.' },
      ],
      testimonial: {
        quote: "Minerva didn't just change our tools; it changed our mind. We no longer manage tasks; we manage strategy.",
        author: 'Marcus Aurelius',
        role: 'Founder, Imperium Creative',
      },
    },
    signup: {
      leftHeading: 'Join Minerva',
      leftDesc: 'Follow these 3 quick steps to activate your agency workspace.',
      steps: ['Register your identity', 'Configure your workspace', 'Invite your team'] as string[],
      heading: 'Create New Profile',
      subheading: 'Input your basic details to begin the journey.',
      firstName: 'First Name',
      lastName: 'Last Name',
      firstNamePlaceholder: 'John',
      lastNamePlaceholder: 'Doe',
      email: 'Email',
      emailPlaceholder: 'you@youragency.com',
      password: 'Password',
      passwordPlaceholder: '••••••••',
      passwordHint: 'Requires at least 8 symbols.',
      submit: 'Create Account',
      footer: 'Already have an account?',
      footerLink: 'Sign in',
      or: 'Or',
      google: 'Google',
      github: 'Github',
    },
    login: {
      leftHeading: 'Welcome back.',
      leftDesc: 'Your workspace is ready, sign in and pick up where you left off.',
      features: [
        'Full project and pipeline visibility',
        'Client approvals and feedback',
        'Billing and retainer tracking',
      ] as string[],
      heading: 'Sign in to Minerva',
      subheading: 'Enter your credentials to access your workspace.',
      email: 'Email',
      emailPlaceholder: 'you@youragency.com',
      password: 'Password',
      passwordPlaceholder: '••••••••',
      forgot: 'Forgot password?',
      submit: 'Sign In',
      or: 'Or',
      magicLink: 'Continue with magic link',
      footer: 'New to Minerva?',
      footerLink: 'Create account',
    },
  },
  fr: {
    nav: {
      brand: 'Minerva',
      items: ['Plateforme', 'Modules', 'Portail Client', 'Sécurité', 'Rapports'] as string[],
      signIn: 'Se connecter',
      requestAccess: "Demander l'accès",
    },
    landing: {
      badge: "Système d'exploitation agence · V1 bientôt disponible",
      headline1: 'Là où la stratégie devient système',
      headline2: 'et la sagesse réinvente le travail des agences',
      subtitle1: "Minerva OS, le système d'exploitation pour les agences",
      subtitle2: 'qui livrent avec clarté, précision et intention',
      cta: "Demander l'accès",
      ctaSecondary: 'Se connecter',
      trust: 'Approuvé par les agences les plus ambitieuses',
      features: {
        platform: {
          title: 'La Plateforme',
          desc: 'Un moteur central pour les leads, l\'onboarding et l\'exécution. Minerva OS orchestre tout le cycle de vie de votre agence avec une précision stratégique.',
        },
        portal: {
          title: 'Portail Client',
          desc: 'Une interface haut de gamme pour vos clients. Retours, approbations et fichiers dans un environnement calme et à votre image.',
          cta: 'Explorer le Portail',
        },
        insights: {
          title: 'Analyses',
          desc: 'Analyses prédictives et suivi des performances en temps réel. La sagesse dérivée de chaque action.',
        },
        security: {
          title: 'Sécurité',
          desc: 'Protection de niveau entreprise. Permissions granulaires et coffres-forts d\'actifs sécurisés en standard.',
        },
        automation: {
          title: 'Assist IA',
          desc: 'Résumés intelligents, détection des risques et flux de travail automatisés qui agissent comme un second cerveau.',
        },
      },
      metrics: [
        { label: 'Augmentation de la rentabilité', value: '30%', desc: 'Grâce à une allocation intelligente des ressources et une cartographie prédictive.' },
        { label: 'Approbations clients plus rapides', value: '2x', desc: 'Des portails sans friction conçus pour les décideurs.' },
        { label: 'Clarté opérationnelle', value: '100%', desc: 'Chaque lead, projet et livrable dans un système unifié.' },
      ],
      testimonial: {
        quote: "Minerva n'a pas seulement changé nos outils ; il a changé notre esprit. Nous ne gérons plus des tâches ; nous gérons une stratégie.",
        author: 'Marcus Aurelius',
        role: 'Fondateur, Imperium Creative',
      },
    },
    signup: {
      leftHeading: 'Rejoindre Minerva',
      leftDesc: 'Suivez ces 3 étapes rapides pour activer votre espace de travail.',
      steps: ['Enregistrez votre identité', 'Configurez votre espace', 'Invitez votre équipe'] as string[],
      heading: 'Créer un profil',
      subheading: 'Entrez vos informations pour commencer.',
      firstName: 'Prénom',
      lastName: 'Nom',
      firstNamePlaceholder: 'Jean',
      lastNamePlaceholder: 'Dupont',
      email: 'Email',
      emailPlaceholder: 'vous@votreagence.com',
      password: 'Mot de passe',
      passwordPlaceholder: '••••••••',
      passwordHint: 'Au moins 8 symboles requis.',
      submit: 'Créer un compte',
      footer: 'Vous avez déjà un compte ?',
      footerLink: 'Se connecter',
      or: 'Ou',
      google: 'Google',
      github: 'Github',
    },
    login: {
      leftHeading: 'Bon retour.',
      leftDesc: 'Votre espace est prêt, connectez-vous pour reprendre là où vous en étiez.',
      features: [
        'Visibilité complète sur les projets',
        'Approbations et retours clients',
        'Suivi de facturation et retainers',
      ] as string[],
      heading: 'Connexion à Minerva',
      subheading: 'Entrez vos identifiants pour accéder à votre espace.',
      email: 'Email',
      emailPlaceholder: 'vous@votreagence.com',
      password: 'Mot de passe',
      passwordPlaceholder: '••••••••',
      forgot: 'Mot de passe oublié ?',
      submit: 'Se connecter',
      or: 'Ou',
      magicLink: 'Continuer avec un lien magique',
      footer: 'Nouveau sur Minerva ?',
      footerLink: 'Créer un compte',
    },
  },
};

export type Translations = typeof translations.en;

interface LangContextType {
  lang: Lang;
  t: Translations;
  setLang: (l: Lang) => void;
}

const LangContext = createContext<LangContextType | null>(null);

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('en');
  return (
    <LangContext.Provider value={{ lang, t: translations[lang], setLang }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within LangProvider');
  return ctx;
}
