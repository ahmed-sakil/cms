import { Toaster } from "sonner";

export const SonnerToaster = () => {
  return (
    <Toaster
      position="top-right"
      closeButton={true}
      richColors={true}
      toastOptions={{
        className:
          "border border-accent bg-surface text-text-main rounded-sm shadow-md font-sans text-sm",
        duration: 4000,
      }}
    />
  );
};
