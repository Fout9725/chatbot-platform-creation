import { ReactNode } from 'react';
import SEO from './SEO';
import FloatingOrbs from './FloatingOrbs';

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  noOrbs?: boolean;
  className?: string;
}

const PageLayout = ({
  children,
  title,
  description,
  keywords,
  ogImage,
  noOrbs = false,
  className = '',
}: PageLayoutProps) => {
  return (
    <>
      <SEO
        title={title}
        description={description}
        keywords={keywords}
        ogImage={ogImage}
      />
      {!noOrbs && <FloatingOrbs />}
      <div
        className={`relative min-h-screen text-white ${className}`}
        style={{
          color: 'rgb(229, 231, 235)',
        }}
      >
        {children}
      </div>
    </>
  );
};

export default PageLayout;
