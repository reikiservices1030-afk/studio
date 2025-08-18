import { SidebarTrigger } from '@/components/ui/sidebar';

type HeaderProps = {
  title: string;
  children?: React.ReactNode;
};

export function Header({ title, children }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 border-b bg-background/80 backdrop-blur-sm sm:px-6 shrink-0">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="md:hidden" />
        <h1 className="text-2xl font-bold font-headline">{title}</h1>
      </div>
      {children && <div className="flex items-center gap-4">{children}</div>}
    </header>
  );
}
