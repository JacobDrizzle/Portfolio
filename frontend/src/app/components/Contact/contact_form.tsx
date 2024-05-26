"use client";
import React, { useState, FormEvent, ChangeEvent } from "react";
import { Label } from "../ui/label";
import { Input, Textarea } from "../ui/input";
import { cn } from "../../utils/cn";
import { collection, addDoc } from "firebase/firestore";
import { firestore } from "../../firebaseConfig";
import Spinner from "../ui/spinner";
import Confetti from "react-dom-confetti";
import MessageSuccessModal from "../ui/message_modal";

export function ContactForm() {
  const [loading, setLoading] = useState<boolean>(false);
  const [fName, setFName] = useState<string>("");
  const [fNameValid, setFNameValid] = useState<boolean>(true);
  const [fNameError, setFNameError] = useState<string>("");
  const [lName, setLName] = useState<string>("");
  const [lNameValid, setLNameValid] = useState<boolean>(true);
  const [lNameError, setLNameError] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [emailValid, setEmailValid] = useState<boolean>(true);
  const [emailError, setEmailError] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [messageValid, setMessageValid] = useState<boolean>(true);
  const [messageError, setMessageError] = useState<string>("");
  const [showConfetti, setShowConfetti] = useState<boolean>(false);
  const [modalOpen, setModalOpen] = useState<boolean>(true);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const nameRegex = /^[A-Za-z]+$/;
  const minMessageLength = 10;

  function validateForm() {
    let valid = true;

    if (!fName || !nameRegex.test(fName)) {
      setFNameValid(false);
      setFNameError(
        "First name is required and should only contain alphabetic characters."
      );
      valid = false;
    } else {
      setFNameValid(true);
      setFNameError("");
    }

    if (!lName || !nameRegex.test(lName)) {
      setLNameValid(false);
      setLNameError(
        "Last name is required and should only contain alphabetic characters."
      );
      valid = false;
    } else {
      setLNameValid(true);
      setLNameError("");
    }

    if (!email || !emailRegex.test(email)) {
      setEmailValid(false);
      setEmailError("A valid email address is required.");
      valid = false;
    } else {
      setEmailValid(true);
      setEmailError("");
    }

    if (!message || message.length < minMessageLength) {
      setMessageValid(false);
      setMessageError(
        `Message is required and should be at least ${minMessageLength} characters long.`
      );
      valid = false;
    } else {
      setMessageValid(true);
      setMessageError("");
    }

    return valid;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!validateForm()) {
      return;
    }
    try {
      setLoading(true);
      // Add document to Firestore collection
      await addDoc(collection(firestore, "contacts"), {
        fName,
        lName,
        email,
        message,
      });
      // Reset form fields after successful submission
      setFName("");
      setLName("");
      setEmail("");
      setMessage("");
    } catch (error) {
      console.error("Error adding document: ", error);
    } finally {
      // Reset loading state after a short delay
      setTimeout(() => {
        setLoading(false);
        // Show confetti
        setShowConfetti(true);
        setModalOpen(true);
        // Reset confetti after 2 seconds
        setTimeout(() => {
          setShowConfetti(false);
        }, 2000);
      }, 500);
    }
  }

  return (
    <div
      className="mt-20 max-w-md w-full mx-auto rounded-2xl p-4 md:p-8
         shadow-input bg-slate-800 dark:bg-black border border-neutral-500 dark:border-[rgba(255,255,255,0.1)] hover:border-emerald-400
         dark:hover:border-emerald-400"
    >
      <h2 className="font-bold text-xl text-neutral-200">
        Feel free to reach out!
      </h2>
      <p className="text-sm max-w-sm mt-2 text-neutral-300">
        Whether you have a question, a project in mind, or just want to say
        hello, I&apos;d love to hear from you. Drop me a message below and
        I&apos;ll get back to you as soon as possible.
      </p>

      <form className="my-8" onSubmit={handleSubmit}>
        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 mb-4">
          <LabelInputContainer>
            <Label
              htmlFor="firstname"
              className={!fNameValid ? "text-red-500" : ""}
            >
              First name
            </Label>
            <Input
              id="firstname"
              placeholder="John"
              name="fName"
              type="text"
              value={fName}
              onChange={({ target }: ChangeEvent<HTMLInputElement>) =>
                setFName(target.value)
              }
              className={!fNameValid ? "border-red-500" : ""}
            />
            {!fNameValid && (
              <p className="text-red-500 text-sm">{fNameError}</p>
            )}
          </LabelInputContainer>
          <LabelInputContainer>
            <Label
              htmlFor="lastname"
              className={!lNameValid ? "text-red-500" : ""}
            >
              Last name
            </Label>
            <Input
              id="lastname"
              placeholder="Doe"
              name="lName"
              type="text"
              value={lName}
              onChange={({ target }: ChangeEvent<HTMLInputElement>) =>
                setLName(target.value)
              }
              className={!lNameValid ? "border-red-500" : ""}
            />
            {!lNameValid && (
              <p className="text-red-500 text-sm">{lNameError}</p>
            )}
          </LabelInputContainer>
        </div>
        <LabelInputContainer className="mb-4">
          <Label htmlFor="email" className={!emailValid ? "text-red-500" : ""}>
            Email Address
          </Label>
          <Input
            id="email"
            placeholder="yourproject@fc.com"
            type="email"
            name="email"
            value={email}
            onChange={({ target }: ChangeEvent<HTMLInputElement>) =>
              setEmail(target.value)
            }
            className={!emailValid ? "border-red-500" : ""}
          />
          {!emailValid && <p className="text-red-500 text-sm">{emailError}</p>}
        </LabelInputContainer>
        <LabelInputContainer className="mb-4">
          <Label
            htmlFor="message"
            className={!messageValid ? "text-red-500" : ""}
          >
            Message
          </Label>
          <Textarea
            id="message"
            placeholder="Your message here..."
            value={message}
            onChange={({ target }: ChangeEvent<HTMLTextAreaElement>) =>
              setMessage(target.value)
            }
            className={!messageValid ? "border-red-500" : ""}
          />
          {!messageValid && (
            <p className="text-red-500 text-sm">{messageError}</p>
          )}
        </LabelInputContainer>
        <button
          className="bg-gradient-to-br relative group/btn from-neutral-600 dark:from-zinc-900 dark:to-zinc-900 to-neutral-500 block dark:bg-zinc-800 w-full text-white rounded-md h-10 font-medium shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:shadow-[0px_1px_0px_0px_var(--zinc-800)_inset,0px_-1px_0px_0px_var(--zinc-800)_inset]"
          type="submit"
          disabled={loading}
        >
          {loading ? (
            <div className="ml-[46%]">
              <Spinner />
            </div>
          ) : (
            "Send Message →"
          )}
          <BottomGradient />
        </button>
        <div className="fixed top-3/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
          <Confetti active={showConfetti} />
        </div>

          <MessageSuccessModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
          >
            <h2 className="text-2xl font-bold">Message Sent!</h2>
            <p className="mt-4">
              Thank you for reaching out. Ill get back to you soon.
            </p>
          </MessageSuccessModal>
        <div className="bg-gradient-to-r from-transparent via-neutral-300 dark:via-neutral-700 to-transparent my-8 h-[1px] w-full" />
      </form>
    </div>
  );
}

const BottomGradient = () => {
  return (
    <>
      <span className="group-hover/btn:opacity-100 block transition duration-500 opacity-0 absolute h-px w-full -bottom-px inset-x-0 bg-gradient-to-r from-transparent via-emerald-600 to-transparent" />
      <span className="group-hover/btn:opacity-100 blur-sm block transition duration-500 opacity-0 absolute h-px w-1/2 mx-auto -bottom-px inset-x-10 bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />
    </>
  );
};

const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("flex flex-col space-y-2 w-full", className)}>
      {children}
    </div>
  );
};
