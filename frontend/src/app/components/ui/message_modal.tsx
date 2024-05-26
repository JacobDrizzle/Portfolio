import React from "react";
import { CardBody, CardContainer, CardItem } from "./3d_card";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const MessageSuccessModal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div
        className="absolute inset-0 bg-black opacity-50"
        onClick={onClose}
      ></div>
      <div className="justify-center mt-4">
        <CardContainer className="inter-var">
          <CardBody
            className="bg-slate-800 relative group/card shadow-2xl dark:hover:shadow-2xl shadow-black dark:hover:shadow-emerald-500/[0.1] dark:bg-black 
                             border-neutral-500 dark:border-[rgba(255,255,255,0.1)] hover:border-emerald-400
                             dark:hover:border-emerald-400 w-fit h-fit rounded-xl p-6 border"
          >
            <div className="flex justify-between items-center mt-4">
              <div className="text-neutral-200 rounded-lg shadow-lg p-6 z-10">
                {children}
                <button
                  onClick={onClose}
                  className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
                >
                  Close
                </button>
              </div>
            </div>
          </CardBody>
        </CardContainer>
      </div>
    </div>
  );
};

export default MessageSuccessModal;
