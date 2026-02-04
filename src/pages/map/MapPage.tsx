import { useEffect, useRef, useState } from "react";
import "./MapPage.css";

/* -------------------- category options -------------------- */

const CATEGORY_OPTIONS = [
  { label: "전체", value: "ALL" },
  { label: "한식", value: "한식" },
  { label: "중식", value: "중식" },
  { label: "일식", value: "일식" },
  { label: "양식", value: "양식" },
  { label: "카페", value: "카페" },
  { label: "술집", value: "술집" },
];

/* -------------------- types -------------------- */

type Store = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  phone: string;
  url: string;
  category: string;
};

export default function MapPage() {
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const markersRef = useRef<kakao.maps.Marker[]>([]);
  const infoRef = useRef<kakao.maps.InfoWindow | null>(null);

  const [keyword, setKeyword] = useState("강남역 맛집");
  const [stores, setStores] = useState<Store[]>([]);
  const [allStores, setAllStores] = useState<Store[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [category, setCategory] = useState("ALL");

  /* -------------------- marker / info -------------------- */

  const clearMarkers = () => {
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    infoRef.current?.close();
    infoRef.current = null;
  };

  const openInfo = (store: Store, marker: kakao.maps.Marker) => {
    const map = mapRef.current;
    if (!map) return;

    infoRef.current?.close();

    const content = `
      <div style="padding:10px;min-width:220px;">
        <div style="font-weight:700;margin-bottom:6px;">
          ${store.name}
        </div>
        <div style="font-size:12px;color:#555;margin-bottom:8px;">
          ${store.address}
        </div>
        <div style="display:flex;gap:8px;align-items:center;">
          <a href="${store.url}" target="_blank" rel="noreferrer"
             style="font-size:12px;color:#ff6b00;">
            카카오에서 보기
          </a>
          <span style="font-size:12px;color:#888;">
            ${store.phone ?? ""}
          </span>
        </div>
      </div>
    `;

    const infoWindow = new kakao.maps.InfoWindow({ content });
    infoWindow.open(map, marker);
    infoRef.current = infoWindow;
  };

  const renderMarkers = (result: Store[]) => {
    const map = mapRef.current;
    if (!map) return;

    clearMarkers();

    result.forEach((store) => {
      const marker = new kakao.maps.Marker({
        map,
        position: new kakao.maps.LatLng(store.lat, store.lng),
      });

      kakao.maps.event.addListener(marker, "click", () => {
        setSelectedId(store.id);
        map.panTo(new kakao.maps.LatLng(store.lat, store.lng));
        openInfo(store, marker);
      });

      markersRef.current.push(marker);
    });
  };

  /* -------------------- search -------------------- */

  const searchPlaces = () => {
    const map = mapRef.current;
    if (!map) return;

    const trimmed = keyword.trim();
    if (!trimmed) return;

    const places = new kakao.maps.services.Places();

    places.keywordSearch(trimmed, (data, status) => {
      if (status !== "OK") {
        setStores([]);
        setAllStores([]);
        clearMarkers();
        return;
      }

      const mapped: Store[] = data.map((p) => ({
        id: p.id,
        name: p.place_name,
        lat: Number(p.y),
        lng: Number(p.x),
        address: p.road_address_name || p.address_name,
        phone: p.phone,
        url: p.place_url,
        category: p.category_name,
      }));

      setAllStores(mapped);
      setStores(mapped);
      setCategory("ALL");
      setSelectedId(mapped[0]?.id ?? null);
      renderMarkers(mapped);

      if (mapped[0]) {
        map.setCenter(
          new kakao.maps.LatLng(mapped[0].lat, mapped[0].lng)
        );
      }
    });
  };

  /* -------------------- category filter -------------------- */

  const filterByCategory = (cat: string) => {
    setCategory(cat);

    if (cat === "ALL") {
      setStores(allStores);
      renderMarkers(allStores);
      return;
    }

    const filtered = allStores.filter((s) =>
      s.category.includes(cat)
    );

    setStores(filtered);
    renderMarkers(filtered);

    if (filtered[0]) {
      mapRef.current?.setCenter(
        new kakao.maps.LatLng(filtered[0].lat, filtered[0].lng)
      );
    }
  };

  /* -------------------- map init -------------------- */

  useEffect(() => {
    if (!window.kakao || !window.kakao.maps) {
      console.error("❌ kakao map not loaded");
      return;
    }

    kakao.maps.load(() => {
      const container = document.getElementById("map");
      if (!container) return;

      const map = new kakao.maps.Map(container, {
        center: new kakao.maps.LatLng(37.5665, 126.978),
        level: 5,
      });

      mapRef.current = map;
      searchPlaces();
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -------------------- list click -------------------- */

  const onClickStore = (store: Store) => {
    const map = mapRef.current;
    if (!map) return;

    setSelectedId(store.id);
    map.panTo(new kakao.maps.LatLng(store.lat, store.lng));

    const index = stores.findIndex((s) => s.id === store.id);
    const targetMarker = markersRef.current[index];

    if (targetMarker) {
      openInfo(store, targetMarker);
    }
  };

  /* -------------------- render -------------------- */

  return (
    <div className="page-container map-wrap">
      <div className="map-left">
        <h2 className="map-title">맛집 지도</h2>

        <div className="map-search">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="예) 강남역 맛집, 성수 카페"
          />
          <button onClick={searchPlaces}>검색</button>
        </div>

        {/* 카테고리 필터 */}
        <div className="category-filter">
          {CATEGORY_OPTIONS.map((c) => (
            <button
              key={c.value}
              type="button"
              className={`cat-btn ${
                category === c.value ? "active" : ""
              }`}
              onClick={() => filterByCategory(c.value)}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="map-result">
          {stores.length === 0 ? (
            <div className="empty">검색 결과가 없습니다.</div>
          ) : (
            stores.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`result-item ${
                  selectedId === s.id ? "active" : ""
                }`}
                onClick={() => onClickStore(s)}
              >
                <div className="name">{s.name}</div>
                <div className="addr">{s.address}</div>
                <div className="meta">{s.category}</div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="map-right">
        <div id="map" className="kakao-map" />
      </div>
    </div>
  );
}
