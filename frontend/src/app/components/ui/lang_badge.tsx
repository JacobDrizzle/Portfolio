import React, { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { badgeConfigs } from "@/app/utils/languages";

interface LanguageBadgeProps {
  languages: string[];
  size?: number;
  iconOnly?: boolean;
  useShields?: boolean;
}

interface LanguageAttributes {
  name: string;
  icon: string;
  color: string;
  homepage?: string;
}

const LanguageBadge: React.FC<LanguageBadgeProps> = ({
  languages,
}: LanguageBadgeProps) => {
  const [error, setError] = useState<boolean>(false);

  const getIconColor = (badgeColor: string) => {
    const hex = badgeColor.replace("#", "") || "000000";
    const [r, g, b] = hex.match(/.{2}/g)?.map((x) => parseInt(x, 16)) || [
      255, 255, 255,
    ];
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 170 ? "000000" : "FFFFFF";
  };

  const getLangAttributes = (lang: string): LanguageAttributes | null => {
    const defaultConfig = { name: lang, color: "000000", icon: "" };
    return (
      badgeConfigs[lang?.toLocaleLowerCase().replaceAll(" ", "")] ||
      defaultConfig
    );
  };

  const handleImageError = () => {
    setError(true);
  };

  // Split languages into groups of 3
  const groupedLanguages = [];
  for (let i = 0; i < languages.length; i += 3) {
    groupedLanguages.push(languages.slice(i, i + 3));
  }

  return (
    <div>
      {groupedLanguages.map((group, groupIndex) => (
        <div key={groupIndex} className="flex gap-2 md:flex-row flex-col mt-2">
          {group.map((lang, index) => {
            const langAttributes = getLangAttributes(lang);
            return langAttributes ? (
              <motion.div 
                key={index}
                className="flex w-fit p-1 pr-3 rounded gap-3"
                style={{
                  backgroundColor: `#${langAttributes?.color}`,
                  color: `#${getIconColor(langAttributes?.color)}`,
                }}
                whileHover={{ scale: 1.05, rotateZ: 2 }}
              >
                {!error ? (
                  <Image
                    height="20"
                    width="20"
                    alt="l"
                    className="ml-3"
                    src={`https://cdn.simpleicons.org/${
                      langAttributes.icon
                    }/${getIconColor(langAttributes?.color)}`}
                    onError={handleImageError}
                  />
                ) : (
                  <div>Error loading image</div>
                )}
                {langAttributes.name}
              </motion.div>
            ) : null;
          })}
        </div>
      ))}
    </div>
  );
};

export default LanguageBadge;
