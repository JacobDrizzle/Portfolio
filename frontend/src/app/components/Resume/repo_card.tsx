import React from 'react';

interface RepoCardProps {
  name: string;
  fullName: string;
  nodeId: string;
}

const RepoCard: React.FC<RepoCardProps> = ({
  name,
  fullName,
  nodeId,
}: RepoCardProps) => {
  return (
    <div className="repo-card">
      <h2>{name}</h2>
      <p>Full Name: {fullName}</p>
      <p>Node ID: {nodeId}</p>
    </div>
  );
};

export default RepoCard;