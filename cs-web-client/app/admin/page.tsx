"use client";

import { useState, useEffect } from "react";
import styled from "styled-components";
import {
  getWhitelistEntries,
  addToWhitelist,
  removeFromWhitelist,
} from "../firebase/functions";

interface WhitelistEntry {
  email: string;
  addedBy: string;
  addedAt: number;
}

export default function AdminPage() {
  const [entries, setEntries] = useState<WhitelistEntry[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const refresh = () => {
    setLoading(true);
    getWhitelistEntries()
      .then(setEntries)
      .catch((e) => setError(e.message || "Failed to load whitelist"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleAdd = async () => {
    if (!newEmail.trim() || !newEmail.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    setError("");
    setSuccess("");
    try {
      await addToWhitelist(newEmail.trim());
      setSuccess(`Added ${newEmail.trim()}`);
      setNewEmail("");
      refresh();
    } catch (e: any) {
      setError(e.message || "Failed to add");
    }
  };

  const handleRemove = async (email: string) => {
    if (!confirm(`Remove ${email} from the whitelist?`)) return;
    setError("");
    try {
      await removeFromWhitelist(email);
      refresh();
    } catch (e: any) {
      setError(e.message || "Failed to remove");
    }
  };

  return (
    <Page>
      <Title>Admin Panel</Title>
      <Subtitle>Manage who can access ClipShare</Subtitle>

      <Section>
        <SectionTitle>Add User to Whitelist</SectionTitle>
        <Row>
          <Input
            placeholder="user@gmail.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <Btn onClick={handleAdd}>Add</Btn>
        </Row>
        {error && <ErrorText>{error}</ErrorText>}
        {success && <SuccessText>{success}</SuccessText>}
      </Section>

      <Section>
        <SectionTitle>Whitelisted Users ({entries.length})</SectionTitle>
        {loading ? (
          <Spinner />
        ) : entries.length === 0 ? (
          <p style={{ color: "#888" }}>
            No users whitelisted yet. Add yourself first.
          </p>
        ) : (
          <Table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Added By</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.email}>
                  <td>{e.email}</td>
                  <td>{e.addedBy || "—"}</td>
                  <td>
                    {e.addedAt
                      ? new Date(e.addedAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td>
                    <RemoveBtn onClick={() => handleRemove(e.email)}>
                      Remove
                    </RemoveBtn>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Section>
    </Page>
  );
}

const Page = styled.div`
  padding: 40px 20px;
  max-width: 800px;
  margin: 0 auto;
`;

const Title = styled.h1`
  font-size: 2rem;
  margin-bottom: 4px;
`;

const Subtitle = styled.p`
  color: #666;
  margin-bottom: 32px;
`;

const Section = styled.div`
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid #ddd;
  margin-bottom: 24px;
`;

const SectionTitle = styled.h2`
  font-size: 1.2rem;
  margin-bottom: 16px;
`;

const Row = styled.div`
  display: flex;
  gap: 8px;
`;

const Input = styled.input`
  flex: 1;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid #ccc;
  font-size: 1rem;
`;

const Btn = styled.button`
  padding: 10px 24px;
  border-radius: 8px;
  border: none;
  background: #000;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  &:hover {
    background: #333;
  }
`;

const RemoveBtn = styled.button`
  padding: 4px 12px;
  border-radius: 6px;
  border: 1px solid #c00;
  background: transparent;
  color: #c00;
  cursor: pointer;
  font-size: 0.85rem;
  &:hover {
    background: #c00;
    color: #fff;
  }
`;

const ErrorText = styled.p`
  color: #c00;
  margin-top: 8px;
`;

const SuccessText = styled.p`
  color: #060;
  margin-top: 8px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  th,
  td {
    text-align: left;
    padding: 10px 12px;
    border-bottom: 1px solid #eee;
  }
  th {
    font-weight: 600;
    color: #555;
    font-size: 0.9rem;
  }
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-top: 4px solid #000;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 20px auto;
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;
