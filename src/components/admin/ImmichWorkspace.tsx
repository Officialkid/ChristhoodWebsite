"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Archive, Check, ChevronLeft, ChevronRight, FolderPlus, Heart, ImagePlus, Images, LoaderCircle, Search, X } from "lucide-react";
import { toast } from "sonner";
import { btnClass } from "./ui";

type Photo = {
  id: string;
  name: string;
  width: number;
  height: number;
  takenAt: string;
  isFavorite: boolean;
  isArchived: boolean;
  thumbnail: string;
  imported: boolean;
};

type Album = { id: string; name: string; assetCount: number; thumbnail: string | null };
type Section = "photos" | "albums" | "search";
type View = "all" | "favorites" | "archive" | "album";

function details(photo: Photo) {
  const dimensions = photo.width && photo.height ? `${photo.width} × ${photo.height}` : "";
  const date = photo.takenAt && Number.isFinite(new Date(photo.takenAt).getTime())
    ? new Date(photo.takenAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
    : "";
  return [dimensions, date].filter(Boolean).join(" · ") || "Photo";
}

function PhotoTile({
  photo,
  selected,
  busy,
  onSelect,
  onOpen,
  onFavorite,
}: {
  photo: Photo;
  selected: boolean;
  busy: boolean;
  onSelect: () => void;
  onOpen: () => void;
  onFavorite: () => void;
}) {
  return (
    <li className="min-w-0">
      <div className="relative aspect-[4/3] overflow-hidden bg-paper-2">
        <button type="button" onClick={onOpen} className="block size-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple" aria-label={`Open ${photo.name}`}>
          {/* eslint-disable-next-line @next/next/no-img-element -- authenticated archive preview */}
          <img src={photo.thumbnail} alt="" loading="lazy" className="size-full object-cover" />
        </button>
        <button
          type="button"
          onClick={onSelect}
          aria-pressed={selected}
          aria-label={selected ? `Deselect ${photo.name}` : `Select ${photo.name}`}
          className={`absolute left-2 top-2 inline-flex size-11 items-center justify-center border border-paper bg-paper/95 text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple ${selected ? "bg-purple text-on-purple" : ""}`}
        >
          {selected && <Check className="size-5" aria-hidden />}
        </button>
        <button
          type="button"
          onClick={onFavorite}
          disabled={busy}
          aria-pressed={photo.isFavorite}
          aria-label={photo.isFavorite ? `Remove ${photo.name} from favorites` : `Add ${photo.name} to favorites`}
          className="absolute right-2 top-2 inline-flex size-11 items-center justify-center border border-paper bg-paper/95 text-purple disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple"
        >
          <Heart className={`size-5 ${photo.isFavorite ? "fill-purple" : ""}`} aria-hidden />
        </button>
        {photo.imported && <span className="absolute bottom-2 left-2 bg-paper px-2 py-1 text-xs font-semibold text-ink">On website</span>}
      </div>
      <p className="mt-2 truncate font-bold" title={photo.name}>{photo.name}</p>
      <p className="text-[0.88rem] text-muted">{details(photo)}</p>
    </li>
  );
}

export default function ImmichWorkspace({
  connected,
  canSave,
  cloudinaryConfigured,
  onImported,
}: {
  connected: boolean;
  canSave: boolean;
  cloudinaryConfigured: boolean;
  onImported: () => void;
}) {
  const [section, setSection] = useState<Section>("photos");
  const [view, setView] = useState<View>("all");
  const [albumId, setAlbumId] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [albumTarget, setAlbumTarget] = useState("");
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [opened, setOpened] = useState<Photo | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Photo[]>([]);
  const [newAlbum, setNewAlbum] = useState("");
  const [creatingAlbum, setCreatingAlbum] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searching, setSearching] = useState(false);
  const [busyPhoto, setBusyPhoto] = useState<string | null>(null);
  const [copying, setCopying] = useState(false);
  const [albumBusy, setAlbumBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [targetFolder, setTargetFolder] = useState("christhood/media");
  const [folders, setFolders] = useState<string[]>([]);
  const [folderParent, setFolderParent] = useState("christhood/media");
  const [folderName, setFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);

  const activePhotos = section === "search" ? results : photos;
  const activeSelected = useMemo(() => selected.filter((id) => activePhotos.some((photo) => photo.id === id)), [activePhotos, selected]);

  useEffect(() => {
    if (!opened) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpened(null); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [opened]);

  useEffect(() => {
    if (!connected) return;
    let current = true;
    void fetch("/api/admin/immich/albums", { cache: "no-store" })
      .then(async (response) => {
        const data = (await response.json()) as { albums?: Album[]; error?: string };
        if (!response.ok) throw new Error(data.error || "Albums could not be loaded.");
        if (current) {
          const loaded = data.albums ?? [];
          setAlbums(loaded);
          if (loaded.length) setAlbumTarget((currentTarget) => currentTarget || loaded[0].id);
        }
      })
      .catch((cause) => { if (current) setError(cause instanceof Error ? cause.message : "Albums could not be loaded."); });
    return () => { current = false; };
  }, [connected]);

  useEffect(() => {
    if (!connected || !cloudinaryConfigured) return;
    let current = true;
    void fetch("/api/admin/cloudinary/folders", { cache: "no-store" })
      .then(async (response) => {
        const data = (await response.json()) as { folders?: string[] };
        if (current && response.ok) {
          const available = data.folders ?? [];
          setFolders(available);
          if (available.length && !available.includes(targetFolder)) setTargetFolder(available.includes("christhood/media") ? "christhood/media" : available[0]);
          if (available.length && !available.includes(folderParent)) setFolderParent(available.includes("christhood/media") ? "christhood/media" : available[0]);
        }
      })
      .catch(() => undefined);
    return () => { current = false; };
  }, [connected, cloudinaryConfigured, targetFolder, folderParent]);

  useEffect(() => {
    if (!connected || section !== "photos") return;
    let current = true;
    const params = new URLSearchParams({ view, page: "1" });
    if (view === "album" && albumId) params.set("albumId", albumId);
    setLoading(true);
    setError("");
    setPhotos([]);
    setSelected([]);
    setNextPage(null);
    void fetch(`/api/admin/immich/library?${params.toString()}`, { cache: "no-store" })
      .then(async (response) => {
        const data = (await response.json()) as { items?: Photo[]; nextPage?: string | null; error?: string };
        if (!response.ok) throw new Error(data.error || "Photos could not be loaded.");
        if (!current) return;
        setPhotos(data.items ?? []);
        setNextPage(data.nextPage ?? null);
      })
      .catch((cause) => { if (current) setError(cause instanceof Error ? cause.message : "Photos could not be loaded."); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [connected, section, view, albumId]);

  async function loadMore() {
    if (nextPage === null || loadingMore) return;
    setLoadingMore(true);
    setError("");
    const params = new URLSearchParams({ view });
    if (nextPage.startsWith("cursor:")) params.set("cursor", nextPage.slice("cursor:".length));
    else params.set("page", nextPage);
    if (view === "album" && albumId) params.set("albumId", albumId);
    try {
      const response = await fetch(`/api/admin/immich/library?${params.toString()}`, { cache: "no-store" });
      const data = (await response.json()) as { items?: Photo[]; nextPage?: string | null; error?: string };
      if (!response.ok) throw new Error(data.error || "More photos could not be loaded.");
      setPhotos((current) => [...current, ...(data.items ?? [])]);
      setNextPage(data.nextPage ?? null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "More photos could not be loaded.");
    } finally {
      setLoadingMore(false);
    }
  }

  async function searchPhotos(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const phrase = query.trim();
    if (phrase.length < 2) {
      setError("Describe the photo you are looking for.");
      return;
    }
    setSearching(true);
    setError("");
    setMessage("");
    setResults([]);
    setSelected([]);
    try {
      const response = await fetch("/api/admin/immich/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: phrase }),
        cache: "no-store",
      });
      const data = (await response.json()) as { items?: Photo[]; error?: string };
      if (!response.ok) throw new Error(data.error || "The photo search could not be completed.");
      setResults(data.items ?? []);
      if (!data.items?.length) setMessage("No matching photos found. Try describing the scene another way.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The photo search could not be completed.");
    } finally {
      setSearching(false);
    }
  }

  function chooseView(nextView: View) {
    setSection("photos");
    setView(nextView);
    if (nextView !== "album") setAlbumId("");
  }

  async function createAlbum(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newAlbum.trim();
    if (!name) return;
    setCreatingAlbum(true);
    setError("");
    try {
      const response = await fetch("/api/admin/immich/albums", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = (await response.json()) as { album?: { id: string; name: string }; error?: string };
      if (!response.ok || !data.album) throw new Error(data.error || "The album could not be created.");
      setAlbums((current) => [...current, { id: data.album!.id, name: data.album!.name, assetCount: 0, thumbnail: null }]);
      setAlbumTarget(data.album.id);
      setNewAlbum("");
      toast.success("Album created.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The album could not be created.");
    } finally {
      setCreatingAlbum(false);
    }
  }

  async function toggleFavorite(photo: Photo) {
    setBusyPhoto(photo.id);
    setError("");
    try {
      const response = await fetch("/api/admin/immich/favorite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: photo.id, isFavorite: !photo.isFavorite }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "The favorite setting could not be saved.");
      const update = (current: Photo[]) => current.map((item) => item.id === photo.id ? { ...item, isFavorite: !photo.isFavorite } : item);
      setPhotos(update);
      setResults(update);
      setOpened((current) => current?.id === photo.id ? { ...current, isFavorite: !photo.isFavorite } : current);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The favorite setting could not be saved.");
    } finally {
      setBusyPhoto(null);
    }
  }

  async function toggleArchived(photo: Photo) {
    const isArchived = !photo.isArchived;
    setBusyPhoto(photo.id);
    setError("");
    try {
      const response = await fetch("/api/admin/immich/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: photo.id, isArchived }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "The archive setting could not be saved.");
      const update = (current: Photo[]) => current
        .map((item) => item.id === photo.id ? { ...item, isArchived } : item)
        .filter((item) => !(view === "archive" && !isArchived && item.id === photo.id));
      setPhotos(update);
      setResults(update);
      setOpened((current) => current?.id === photo.id ? { ...current, isArchived } : current);
      toast.success(isArchived ? "Photo archived." : "Photo returned to the library.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The archive setting could not be saved.");
    } finally {
      setBusyPhoto(null);
    }
  }

  function toggleSelected(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  async function createFolder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = folderName.trim();
    if (!name) return;
    setCreatingFolder(true);
    setError("");
    try {
      const response = await fetch("/api/admin/cloudinary/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parent: folderParent, name }),
      });
      const data = (await response.json()) as { path?: string; folders?: string[]; error?: string };
      if (!response.ok || !data.path) throw new Error(data.error || "The folder could not be created.");
      setFolders(data.folders ?? folders);
      setFolderName("");
      setTargetFolder(data.path);
      toast.success("Folder created.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The folder could not be created.");
    } finally {
      setCreatingFolder(false);
    }
  }

  async function changeSelectedAlbum(action: "add" | "remove") {
    const destination = action === "remove" ? albumId : albumTarget;
    if (!destination || !activeSelected.length || albumBusy) return;
    setAlbumBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/immich/albums/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ albumId: destination, assetIds: activeSelected, action }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "The album could not be updated.");
      if (action === "remove") setPhotos((current) => current.filter((photo) => !activeSelected.includes(photo.id)));
      setSelected((current) => current.filter((id) => !activeSelected.includes(id)));
      const responseAlbums = await fetch("/api/admin/immich/albums", { cache: "no-store" });
      const albumData = (await responseAlbums.json()) as { albums?: Album[] };
      if (responseAlbums.ok) setAlbums(albumData.albums ?? []);
      toast.success(action === "add" ? "Photos added to album." : "Photos removed from album.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The album could not be updated.");
    } finally {
      setAlbumBusy(false);
    }
  }

  async function copySelected() {
    if (!activeSelected.length || copying) return;
    setCopying(true);
    setError("");
    setMessage("");
    const succeeded: string[] = [];
    try {
      for (const id of activeSelected) {
        const response = await fetch("/api/admin/immich/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assetId: id, folder: targetFolder }),
        });
        const data = (await response.json()) as { error?: string };
        if (!response.ok && response.status !== 409) throw new Error(data.error || "A photo could not be added to the website.");
        succeeded.push(id);
      }
      const markImported = (current: Photo[]) => current.map((photo) => succeeded.includes(photo.id) ? { ...photo, imported: true } : photo);
      setPhotos(markImported);
      setResults(markImported);
      setSelected((current) => current.filter((id) => !succeeded.includes(id)));
      setMessage(`${succeeded.length} ${succeeded.length === 1 ? "photo was" : "photos were"} added to the website photo library.`);
      onImported();
      toast.success("Photos added to the website.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The selected photos could not be added to the website.");
      if (succeeded.length) {
        const markImported = (current: Photo[]) => current.map((photo) => succeeded.includes(photo.id) ? { ...photo, imported: true } : photo);
        setPhotos(markImported);
        setResults(markImported);
        onImported();
      }
    } finally {
      setCopying(false);
    }
  }

  const navButton = (label: string, icon: React.ReactNode, active: boolean, onClick: () => void) => (
    <button type="button" onClick={onClick} aria-current={active ? "page" : undefined} className={`inline-flex min-h-11 items-center gap-2 border-b-2 px-3 text-left font-semibold md:w-full md:border-b-0 md:border-l-2 md:px-3 ${active ? "border-purple text-purple" : "border-transparent text-ink hover:bg-paper-2"}`}>
      {icon}{label}
    </button>
  );

  return (
    <section aria-labelledby="archive-title" className="min-w-0">
      <div className="border-b border-rule pb-5">
        <h2 id="archive-title" className="text-2xl">Photo archive</h2>
        <p className="f-hint mt-2 max-w-3xl">Browse, sort and find the church&apos;s photos here. Select pictures to prepare them for use on the website.</p>
      </div>

      {!connected ? (
        <p className="mt-5 max-w-3xl border-l-2 border-gold pl-4 text-muted">The photo archive is not connected yet. Ask the site administrator to connect it in the hosting settings.</p>
      ) : (
        <div className="mt-5 grid min-w-0 gap-6 md:grid-cols-[12rem_minmax(0,1fr)]">
          <nav aria-label="Photo archive" className="flex gap-1 overflow-x-auto border-b border-rule md:block md:border-b-0 md:border-r md:pr-4">
            {navButton("Photos", <Images className="size-4" aria-hidden />, section === "photos" && view === "all", () => chooseView("all"))}
            {navButton("Albums", <FolderPlus className="size-4" aria-hidden />, section === "albums", () => { setSection("albums"); setError(""); })}
            {navButton("Favorites", <Heart className="size-4" aria-hidden />, section === "photos" && view === "favorites", () => chooseView("favorites"))}
            {navButton("Archive", <Archive className="size-4" aria-hidden />, section === "photos" && view === "archive", () => chooseView("archive"))}
            {navButton("Find a photo", <Search className="size-4" aria-hidden />, section === "search", () => { setSection("search"); setSelected([]); setError(""); setMessage(""); })}
          </nav>

          <div className="min-w-0">
            {error && <p role="alert" className="mb-4 text-danger">{error}</p>}
            {message && <p aria-live="polite" className="mb-4 text-muted">{message}</p>}

            {section === "search" && (
              <div className="border-b border-rule pb-5">
                <h3 className="text-xl">Find by description</h3>
                <p className="f-hint mt-1">Describe the scene, people, place or activity in the photo.</p>
                <form onSubmit={searchPhotos} className="mt-4 flex max-w-3xl flex-col gap-3 min-[560px]:flex-row">
                  <div className="min-w-0 flex-1">
                    <label htmlFor="archive-query" className="f-label">What should the photo show?</label>
                    <input id="archive-query" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="For example, Sunday worship in the sanctuary" maxLength={160} className="f-input" required />
                  </div>
                  <button type="submit" disabled={searching} className={btnClass.purple + " self-end"}>
                    {searching ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <Search className="size-4" aria-hidden />}
                    {searching ? "Searching…" : "Find photos"}
                  </button>
                </form>
                {activeSelected.length > 0 && (
                  <div className="mt-4 flex flex-col gap-3 min-[620px]:flex-row min-[620px]:items-end min-[620px]:justify-between">
                    <p className="font-semibold">{activeSelected.length} {activeSelected.length === 1 ? "photo selected" : "photos selected"}</p>
                    <div className="flex min-w-0 flex-wrap gap-3">
                      {albums.length > 0 && (
                        <div className="flex min-w-0 flex-col gap-2 min-[560px]:flex-row min-[560px]:items-end">
                          <div className="min-w-0">
                            <label htmlFor="search-target-album" className="f-label">Add to album</label>
                            <select id="search-target-album" className="f-input" value={albumTarget} onChange={(event) => setAlbumTarget(event.target.value)}>
                              {albums.map((album) => <option key={album.id} value={album.id}>{album.name}</option>)}
                            </select>
                          </div>
                          <button type="button" onClick={() => void changeSelectedAlbum("add")} disabled={albumBusy || !albumTarget} className={btnClass.secondary}>{albumBusy ? "Updating…" : "Add to album"}</button>
                        </div>
                      )}
                      {cloudinaryConfigured ? (
                        <div className="flex min-w-0 flex-col gap-2 min-[560px]:flex-row min-[560px]:items-end">
                        <div className="min-w-0">
                          <label htmlFor="search-target-folder" className="f-label">Website folder</label>
                          <select id="search-target-folder" className="f-input" value={targetFolder} onChange={(event) => setTargetFolder(event.target.value)}>
                            {(folders.length ? folders : ["christhood/media"]).filter((folder) => folder.startsWith("christhood/")).map((folder) => <option key={folder} value={folder}>{folder.slice("christhood/".length)}</option>)}
                          </select>
                        </div>
                        <button type="button" onClick={copySelected} disabled={copying || !canSave} className={btnClass.primary}>
                          {copying ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <ImagePlus className="size-4" aria-hidden />}
                          {copying ? "Adding photos…" : "Add to website"}
                        </button>
                      </div>
                      ) : <p className="text-sm text-muted">Connect the website photo host before adding archive photos to page pictures.</p>}
                    </div>
                  </div>
                )}
              </div>
            )}

            {section === "albums" && (
              <div>
                <div className="flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-4">
                  <div>
                    <h3 className="text-xl">Albums</h3>
                    <p className="f-hint mt-1">Group photos by service, event or programme.</p>
                  </div>
                  <form onSubmit={createAlbum} className="flex w-full max-w-xl flex-col gap-2 min-[560px]:flex-row">
                    <div className="min-w-0 flex-1">
                      <label htmlFor="new-album" className="f-label">New album</label>
                      <input id="new-album" className="f-input" value={newAlbum} onChange={(event) => setNewAlbum(event.target.value)} maxLength={120} placeholder="Album name" required />
                    </div>
                    <button className={btnClass.secondary + " self-end"} type="submit" disabled={creatingAlbum}>
                      {creatingAlbum ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <FolderPlus className="size-4" aria-hidden />}
                      Create album
                    </button>
                  </form>
                </div>
                {albums.length === 0 ? (
                  <p className="py-8 text-muted">No albums yet. Create one here to start arranging the archive.</p>
                ) : (
                  <ul className="divide-y divide-rule">
                    {albums.map((album) => (
                      <li key={album.id}>
                        <button type="button" onClick={() => { setAlbumId(album.id); setView("album"); setSection("photos"); setSelected([]); }} className="flex min-h-20 w-full items-center gap-4 py-3 text-left hover:bg-paper-2 focus-visible:outline-2 focus-visible:outline-purple">
                          <span className="size-16 shrink-0 overflow-hidden bg-paper-2">
                            {album.thumbnail && <img src={album.thumbnail} alt="" loading="lazy" className="size-full object-cover" />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-bold">{album.name}</span>
                            <span className="text-sm text-muted">{album.assetCount} {album.assetCount === 1 ? "photo" : "photos"}</span>
                          </span>
                          <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {section === "photos" && (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule pb-3">
                  <div>
                    <h3 className="text-xl">{view === "favorites" ? "Favorites" : view === "archive" ? "Archived photos" : view === "album" ? albums.find((album) => album.id === albumId)?.name ?? "Album photos" : "All photos"}</h3>
                    <p className="text-sm text-muted">{loading ? "Loading photos…" : `${photos.length} photos shown`}</p>
                  </div>
                  {photos.length > 0 && <button type="button" onClick={() => setSelected(selected.length === photos.length ? [] : photos.map((photo) => photo.id))} className="inline-flex min-h-11 items-center gap-2 px-3 font-semibold text-purple hover:bg-purple-tint">{selected.length === photos.length ? "Clear selection" : "Select all shown"}</button>}
                </div>
                {activeSelected.length > 0 && (
                  <div className="my-4 flex flex-col gap-3 border-b border-rule pb-4 min-[620px]:flex-row min-[620px]:items-end min-[620px]:justify-between">
                    <p className="font-semibold">{activeSelected.length} {activeSelected.length === 1 ? "photo selected" : "photos selected"}</p>
                    <div className="flex min-w-0 flex-wrap gap-3">
                      {albums.length > 0 && (
                        <div className="flex min-w-0 flex-col gap-2 min-[560px]:flex-row min-[560px]:items-end">
                          {view === "album" ? (
                            <button type="button" onClick={() => void changeSelectedAlbum("remove")} disabled={albumBusy} className={btnClass.secondary}>{albumBusy ? "Updating…" : "Remove from album"}</button>
                          ) : (
                            <>
                              <div className="min-w-0">
                                <label htmlFor="photos-target-album" className="f-label">Add to album</label>
                                <select id="photos-target-album" className="f-input" value={albumTarget} onChange={(event) => setAlbumTarget(event.target.value)}>
                                  {albums.map((album) => <option key={album.id} value={album.id}>{album.name}</option>)}
                                </select>
                              </div>
                              <button type="button" onClick={() => void changeSelectedAlbum("add")} disabled={albumBusy || !albumTarget} className={btnClass.secondary}>{albumBusy ? "Updating…" : "Add to album"}</button>
                            </>
                          )}
                        </div>
                      )}
                      {cloudinaryConfigured ? (
                        <div className="flex min-w-0 flex-col gap-2 min-[560px]:flex-row min-[560px]:items-end">
                        <div className="min-w-0">
                          <label htmlFor="target-folder" className="f-label">Website folder</label>
                          <select id="target-folder" className="f-input" value={targetFolder} onChange={(event) => setTargetFolder(event.target.value)}>
                            {(folders.length ? folders : ["christhood/media"]).filter((folder) => folder.startsWith("christhood/")).map((folder) => <option key={folder} value={folder}>{folder.slice("christhood/".length)}</option>)}
                          </select>
                        </div>
                        <button type="button" onClick={copySelected} disabled={copying || !canSave} className={btnClass.primary}>
                          {copying ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <ImagePlus className="size-4" aria-hidden />}
                          {copying ? "Adding photos…" : "Add to website"}
                        </button>
                      </div>
                      ) : <p className="max-w-xl text-sm text-muted">Connect the website photo host before adding archive photos to page pictures.</p>}
                    </div>
                  </div>
                )}
                {cloudinaryConfigured && canSave && (
                  <details className="mb-4 border-b border-rule pb-3">
                    <summary className="inline-flex min-h-11 cursor-pointer items-center gap-2 font-semibold text-purple"><FolderPlus className="size-4" aria-hidden /> Create a website folder</summary>
                    <form onSubmit={createFolder} className="mt-3 flex max-w-2xl flex-col gap-3 min-[560px]:flex-row min-[560px]:items-end">
                      <div className="min-w-0 flex-1">
                        <label htmlFor="folder-parent" className="f-label">Inside</label>
                        <select id="folder-parent" className="f-input" value={folderParent} onChange={(event) => setFolderParent(event.target.value)}>
                          {(folders.length ? folders : ["christhood/media"]).filter((folder) => folder.startsWith("christhood/")).map((folder) => <option key={folder} value={folder}>{folder}</option>)}
                        </select>
                      </div>
                      <div className="min-w-0 flex-1">
                        <label htmlFor="folder-name" className="f-label">Folder name</label>
                        <input id="folder-name" className="f-input" value={folderName} onChange={(event) => setFolderName(event.target.value)} maxLength={48} placeholder="Sunday services" required />
                      </div>
                      <button className={btnClass.secondary} type="submit" disabled={creatingFolder}>{creatingFolder ? "Creating…" : "Create folder"}</button>
                    </form>
                  </details>
                )}
                {loading ? <p className="py-8 text-muted">Loading photos…</p> : photos.length === 0 && !error ? <p className="py-8 text-muted">No photos here yet. Try another section or find one by description.</p> : (
                  <>
                    <ul className="grid grid-cols-2 gap-x-4 gap-y-7 min-[620px]:grid-cols-3 xl:grid-cols-4">
                      {photos.map((photo) => <PhotoTile key={photo.id} photo={photo} selected={selected.includes(photo.id)} busy={busyPhoto === photo.id} onSelect={() => toggleSelected(photo.id)} onOpen={() => setOpened(photo)} onFavorite={() => void toggleFavorite(photo)} />)}
                    </ul>
                    {nextPage !== null && <button type="button" onClick={loadMore} disabled={loadingMore} className={`${btnClass.secondary} mt-7`}>{loadingMore ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null}{loadingMore ? "Loading…" : "Load more photos"}</button>}
                  </>
                )}
              </div>
            )}

            {section === "search" && (searching ? <p className="py-8 text-muted">Searching the archive…</p> : results.length > 0 ? (
              <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-7 min-[620px]:grid-cols-3 xl:grid-cols-4">
                {results.map((photo) => <PhotoTile key={photo.id} photo={photo} selected={selected.includes(photo.id)} busy={busyPhoto === photo.id} onSelect={() => toggleSelected(photo.id)} onOpen={() => setOpened(photo)} onFavorite={() => void toggleFavorite(photo)} />)}
              </ul>
            ) : !error && !message ? <p className="py-8 text-muted">Search by describing what is in the picture.</p> : null)}
          </div>
        </div>
      )}

      {opened && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/90 p-3 sm:p-8" role="dialog" aria-modal="true" aria-label={opened.name}>
          <button type="button" onClick={() => setOpened(null)} className="absolute right-3 top-3 inline-flex size-11 items-center justify-center bg-paper text-ink sm:right-6 sm:top-6" aria-label="Close photo"><X className="size-5" aria-hidden /></button>
          <div className="grid max-h-full w-full max-w-6xl gap-4 md:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="flex min-h-0 items-center justify-center overflow-hidden bg-ink">
              {/* eslint-disable-next-line @next/next/no-img-element -- authenticated archive preview */}
              <img src={opened.thumbnail} alt={opened.name} className="max-h-[75vh] max-w-full object-contain" />
            </div>
            <aside className="self-end bg-paper p-4 text-ink md:self-center">
              <h3 className="break-words text-lg font-bold">{opened.name}</h3>
              <p className="mt-1 text-sm text-muted">{details(opened)}</p>
              <div className="mt-4 grid gap-2">
                <button type="button" onClick={() => void toggleFavorite(opened)} disabled={busyPhoto === opened.id} className={btnClass.secondary}>
                  <Heart className={`size-4 ${opened.isFavorite ? "fill-purple text-purple" : ""}`} aria-hidden />
                  {opened.isFavorite ? "Remove favorite" : "Add to favorites"}
                </button>
                <button type="button" onClick={() => void toggleArchived(opened)} disabled={busyPhoto === opened.id} className={btnClass.secondary}>
                  <Archive className="size-4" aria-hidden />
                  {opened.isArchived ? "Return to photos" : "Archive photo"}
                </button>
                <button type="button" onClick={() => { toggleSelected(opened.id); setOpened(null); }} className={btnClass.purple}>
                  {selected.includes(opened.id) ? "Deselect photo" : "Select photo"}
                </button>
              </div>
              <div className="mt-4 flex justify-between border-t border-rule pt-3">
                <button type="button" onClick={() => {
                  const index = activePhotos.findIndex((photo) => photo.id === opened.id);
                  if (index > 0) setOpened(activePhotos[index - 1]);
                }} disabled={activePhotos.findIndex((photo) => photo.id === opened.id) <= 0} className="inline-flex min-h-11 items-center gap-1 px-2 text-purple disabled:opacity-40" aria-label="Previous photo"><ChevronLeft className="size-5" aria-hidden />Previous</button>
                <button type="button" onClick={() => {
                  const index = activePhotos.findIndex((photo) => photo.id === opened.id);
                  if (index >= 0 && index < activePhotos.length - 1) setOpened(activePhotos[index + 1]);
                }} disabled={activePhotos.findIndex((photo) => photo.id === opened.id) < 0 || activePhotos.findIndex((photo) => photo.id === opened.id) >= activePhotos.length - 1} className="inline-flex min-h-11 items-center gap-1 px-2 text-purple disabled:opacity-40" aria-label="Next photo">Next<ChevronRight className="size-5" aria-hidden /></button>
              </div>
            </aside>
          </div>
        </div>
      )}
    </section>
  );
}
