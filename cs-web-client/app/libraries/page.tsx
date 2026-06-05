"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styled from "styled-components";
import {
  getMyNamespaces,
  createNamespace,
  getNamespaceVideos,
  addNamespaceMember,
  removeNamespaceMember,
  generateNamespaceInvite,
  Namespace,
  Video,
} from "../firebase/functions";

export default function LibrariesPage() {
  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [selected, setSelected] = useState<Namespace | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [newName, setNewName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [inviteCopied, setInviteCopied] = useState(false);

  const refresh = () => {
    getMyNamespaces()
      .then(setNamespaces)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    setInviteUrl("");
    setInviteCopied(false);
    if (!selected) {
      setVideos([]);
      return;
    }
    getNamespaceVideos(selected.id).then(setVideos).catch(() => setVideos([]));
  }, [selected]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setError("");
    try {
      const ns = await createNamespace(newName.trim());
      setNamespaces((prev) => [...prev, ns]);
      setNewName("");
    } catch (e: any) {
      setError(e.message || "Failed to create library");
    }
  };

  const handleAddMember = async () => {
    if (!selected || !memberEmail.trim()) return;
    setError("");
    try {
      await addNamespaceMember(selected.id, memberEmail.trim());
      // refresh namespace data
      const updated = await getMyNamespaces();
      setNamespaces(updated);
      setSelected(updated.find((n) => n.id === selected.id) || null);
      setMemberEmail("");
    } catch (e: any) {
      setError(e.message || "Failed to add member");
    }
  };

  const handleGenerateInvite = async () => {
    if (!selected) return;
    setError("");
    try {
      const result = await generateNamespaceInvite(selected.id);
      setInviteUrl(`${window.location.origin}/join/${result.inviteCode}`);
      setInviteCopied(false);
    } catch (e: any) {
      setError(e.message || "Failed to generate invite link");
    }
  };

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(inviteUrl);
    setInviteCopied(true);
  };

  const handleRemoveMember = async (email: string) => {
    if (!selected) return;
    try {
      await removeNamespaceMember(selected.id, email);
      const updated = await getMyNamespaces();
      setNamespaces(updated);
      setSelected(updated.find((n) => n.id === selected.id) || null);
    } catch (e: any) {
      setError(e.message || "Failed to remove member");
    }
  };

  if (loading) {
    return (
      <Page>
        <Spinner />
      </Page>
    );
  }

  return (
    <Page>
      <Title>My Libraries</Title>

      <CreateRow>
        <Input
          placeholder="New library name..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />
        <Btn onClick={handleCreate}>Create</Btn>
      </CreateRow>

      {error && <ErrorText>{error}</ErrorText>}

      <Grid>
        {namespaces.map((ns) => (
          <Card
            key={ns.id}
            $active={selected?.id === ns.id}
            onClick={() => setSelected(ns)}
          >
            <h3>{ns.name}</h3>
            <small>{ns.members.length} members</small>
          </Card>
        ))}
        {namespaces.length === 0 && (
          <p style={{ color: "#666" }}>No libraries yet. Create one above.</p>
        )}
      </Grid>

      {selected && (
        <DetailPanel>
          <h2>{selected.name}</h2>
          <p>Owner: {selected.ownerEmail}</p>

          <SectionTitle>Members</SectionTitle>
          <MemberList>
            {selected.members.map((m) => (
              <MemberRow key={m}>
                <span>{m}</span>
                {m !== selected.ownerEmail && (
                  <SmallBtn onClick={() => handleRemoveMember(m)}>
                    Remove
                  </SmallBtn>
                )}
              </MemberRow>
            ))}
          </MemberList>

          <AddRow>
            <Input
              placeholder="Add member email..."
              value={memberEmail}
              onChange={(e) => setMemberEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddMember()}
            />
            <Btn onClick={handleAddMember}>Add</Btn>
          </AddRow>

          <SectionTitle>Invite Link</SectionTitle>
          <Btn onClick={handleGenerateInvite}>Generate Invite Link</Btn>
          {inviteUrl && (
            <InviteRow>
              <InviteUrlText>{inviteUrl}</InviteUrlText>
              <CopyBtn onClick={handleCopyInvite}>
                {inviteCopied ? "Copied" : "Copy"}
              </CopyBtn>
            </InviteRow>
          )}

          <SectionTitle>Videos in Library</SectionTitle>
          {videos.length === 0 && (
            <p style={{ color: "#888" }}>
              No videos yet. Upload one and assign it to this library.
            </p>
          )}
          <VideoGrid>
            {videos.map((v) => (
              <Link
                key={v.id}
                href={`/watch?v=${v.filename}&title=${encodeURIComponent(
                  v.title || ""
                )}&description=${encodeURIComponent(
                  v.description || ""
                )}&key=${encodeURIComponent(
                  v.key || ""
                )}&shareId=${encodeURIComponent(v.shareId || "")}`}
              >
                <VideoCard>
                  <img
                    src={v.thumbnailUrl || "/thumbnail.png"}
                    alt="thumb"
                    width={200}
                    height={130}
                  />
                  <p>{v.title}</p>
                </VideoCard>
              </Link>
            ))}
          </VideoGrid>
        </DetailPanel>
      )}
    </Page>
  );
}

const Page = styled.div`
  padding: 40px 20px;
  max-width: 900px;
  margin: 0 auto;
`;

const Title = styled.h1`
  font-size: 2rem;
  margin-bottom: 24px;
`;

const CreateRow = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
`;

const AddRow = styled(CreateRow)`
  margin-top: 12px;
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

const SmallBtn = styled.button`
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
  margin-bottom: 12px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
`;

const Card = styled.div<{ $active: boolean }>`
  padding: 20px;
  border-radius: 12px;
  background: ${(p) => (p.$active ? "#000" : "#fff")};
  color: ${(p) => (p.$active ? "#fff" : "#000")};
  border: 2px solid ${(p) => (p.$active ? "#000" : "#ddd")};
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    border-color: #000;
  }
  h3 {
    margin-bottom: 4px;
  }
`;

const DetailPanel = styled.div`
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid #ddd;
`;

const SectionTitle = styled.h3`
  margin-top: 20px;
  margin-bottom: 8px;
  font-size: 1.1rem;
`;

const MemberList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const MemberRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  border-radius: 6px;
  background: #f5f5f5;
`;

const VideoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 12px;
`;

const VideoCard = styled.div`
  text-align: center;
  img {
    border-radius: 8px;
    width: 100%;
    height: auto;
  }
  p {
    margin-top: 6px;
    font-weight: 600;
    font-size: 0.95rem;
  }
`;

const InviteRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  padding: 10px 14px;
  background: #f5f5f5;
  border-radius: 8px;
`;

const InviteUrlText = styled.span`
  flex: 1;
  font-size: 0.9rem;
  word-break: break-all;
  color: #333;
`;

const CopyBtn = styled.button`
  padding: 6px 16px;
  border-radius: 6px;
  border: 1px solid #000;
  background: transparent;
  color: #000;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
  &:hover {
    background: #000;
    color: #fff;
  }
`;

const Spinner = styled.div`
  width: 60px;
  height: 60px;
  border: 6px solid rgba(0, 0, 0, 0.1);
  border-top: 6px solid #000;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 100px auto;
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;
