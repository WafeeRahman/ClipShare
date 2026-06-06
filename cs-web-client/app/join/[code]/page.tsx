"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import styled from "styled-components";
import { joinNamespaceByInvite } from "../../firebase/functions";

export default function JoinPage() {
  const params = useParams();
  const code = params.code as string;
  const [loading, setLoading] = useState(true);
  const [namespaceName, setNamespaceName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!code) return;
    joinNamespaceByInvite(code)
      .then((result) => {
        setNamespaceName(result.namespaceName);
      })
      .catch((e: any) => {
        setError(e.message || "Failed to join via invite link");
      })
      .finally(() => setLoading(false));
  }, [code]);

  if (loading) {
    return (
      <Page>
        <Spinner />
      </Page>
    );
  }

  if (error) {
    return (
      <Page>
        <Card>
          <Title>Unable to Join</Title>
          <Message>{error}</Message>
        </Card>
      </Page>
    );
  }

  return (
    <Page>
      <Card>
        <Title>You&apos;ve joined {namespaceName}!</Title>
        <StyledLink href="/libraries">Go to Libraries</StyledLink>
      </Card>
    </Page>
  );
}

const Page = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  padding: 40px 20px;
`;

const Card = styled.div`
  background: #fff;
  border-radius: 16px;
  padding: 40px;
  border: 1px solid #ddd;
  text-align: center;
  max-width: 480px;
  width: 100%;
`;

const Title = styled.h1`
  font-size: 1.8rem;
  margin-bottom: 16px;
`;

const Message = styled.p`
  color: #c00;
  font-size: 1rem;
  margin-bottom: 8px;
`;

const StyledLink = styled(Link)`
  display: inline-block;
  margin-top: 12px;
  padding: 12px 32px;
  border-radius: 8px;
  background: #000;
  color: #fff;
  font-weight: 600;
  text-decoration: none;
  &:hover {
    background: #333;
  }
`;

const Spinner = styled.div`
  width: 60px;
  height: 60px;
  border: 6px solid rgba(0, 0, 0, 0.1);
  border-top: 6px solid #000;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;
