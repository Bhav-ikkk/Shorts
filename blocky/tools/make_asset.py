#!/usr/bin/env python3
"""
Blocky Story Engine — Headless Asset Generator & Exporter (Phase B9: Tier C)
Builds low-poly hero assets and exports standard glTF 2.0 binary (.glb) files.
Can be executed either headless inside Blender:
    blender -b -P blocky/tools/make_asset.py -- --asset trophy --out blocky/assets/models/hero_trophy.glb
or standalone in pure Python without Blender dependencies:
    python blocky/tools/make_asset.py --asset trophy --out blocky/assets/models/hero_trophy.glb
"""

import sys
import os
import json
import math
import struct
import argparse

# Check if running inside Blender
IS_BLENDER = False
try:
    import bpy # type: ignore
    import mathutils # type: ignore
    IS_BLENDER = True
except ImportError:
    IS_BLENDER = False


def create_box_geometry(width, height, depth, center=(0.0, 0.0, 0.0)):
    """Generates box vertices, normals, and triangle indices."""
    hw, hh, hd = width / 2.0, height / 2.0, depth / 2.0
    cx, cy, cz = center

    # 6 faces * 4 vertices = 24 vertices
    positions = [
        # Front (+Z)
        cx - hw, cy - hh, cz + hd,
        cx + hw, cy - hh, cz + hd,
        cx + hw, cy + hh, cz + hd,
        cx - hw, cy + hh, cz + hd,
        # Back (-Z)
        cx + hw, cy - hh, cz - hd,
        cx - hw, cy - hh, cz - hd,
        cx - hw, cy + hh, cz - hd,
        cx + hw, cy + hh, cz - hd,
        # Top (+Y)
        cx - hw, cy + hh, cz + hd,
        cx + hw, cy + hh, cz + hd,
        cx + hw, cy + hh, cz - hd,
        cx - hw, cy + hh, cz - hd,
        # Bottom (-Y)
        cx - hw, cy - hh, cz - hd,
        cx + hw, cy - hh, cz - hd,
        cx + hw, cy - hh, cz + hd,
        cx - hw, cy - hh, cz + hd,
        # Right (+X)
        cx + hw, cy - hh, cz + hd,
        cx + hw, cy - hh, cz - hd,
        cx + hw, cy + hh, cz - hd,
        cx + hw, cy + hh, cz + hd,
        # Left (-X)
        cx - hw, cy - hh, cz - hd,
        cx - hw, cy - hh, cz + hd,
        cx - hw, cy + hh, cz + hd,
        cx - hw, cy + hh, cz - hd,
    ]

    normals = [
        # Front
        0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0,
        # Back
        0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0,
        # Top
        0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,
        # Bottom
        0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0,
        # Right
        1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0,
        # Left
        -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,
    ]

    indices = []
    for face in range(6):
        base = face * 4
        indices.extend([base, base + 1, base + 2, base, base + 2, base + 3])

    return positions, normals, indices


def create_octahedron_geometry(radius, center=(0.0, 0.0, 0.0)):
    """Generates an octahedral diamond crystal."""
    cx, cy, cz = center
    r = radius
    pts = [
        (cx, cy + r * 1.3, cz),      # 0: top
        (cx + r, cy, cz),            # 1: right
        (cx, cy, cz + r),            # 2: front
        (cx - r, cy, cz),            # 3: left
        (cx, cy, cz - r),            # 4: back
        (cx, cy - r * 1.3, cz),      # 5: bottom
    ]

    faces = [
        (0, 1, 2), (0, 2, 3), (0, 3, 4), (0, 4, 1),
        (5, 2, 1), (5, 3, 2), (5, 4, 3), (5, 1, 4),
    ]

    positions = []
    normals = []
    indices = []

    for i, (a, b, c) in enumerate(faces):
        p0, p1, p2 = pts[a], pts[b], pts[c]
        v1 = (p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2])
        v2 = (p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2])
        nx = v1[1] * v2[2] - v1[2] * v2[1]
        ny = v1[2] * v2[0] - v1[0] * v2[2]
        nz = v1[0] * v2[1] - v1[1] * v2[0]
        length = math.sqrt(nx * nx + ny * ny + nz * nz) or 1.0
        nx, ny, nz = nx / length, ny / length, nz / length

        base = len(positions) // 3
        positions.extend([p0[0], p0[1], p0[2], p1[0], p1[1], p1[2], p2[0], p2[1], p2[2]])
        normals.extend([nx, ny, nz, nx, ny, nz, nx, ny, nz])
        indices.extend([base, base + 1, base + 2])

    return positions, normals, indices


def build_trophy_mesh_data():
    """Assembles all sub-meshes for the Hero Golden Trophy."""
    parts = []

    # 1. Base pedestal lower block (Obsidian slate)
    p1, n1, idx1 = create_box_geometry(0.64, 0.16, 0.64, center=(0.0, 0.08, 0.0))
    parts.append({
        "name": "PedestalBase",
        "positions": p1, "normals": n1, "indices": idx1,
        "materialIndex": 0  # Slate
    })

    # 2. Base pedestal upper tier
    p2, n2, idx2 = create_box_geometry(0.48, 0.12, 0.48, center=(0.0, 0.22, 0.0))
    parts.append({
        "name": "PedestalTier",
        "positions": p2, "normals": n2, "indices": idx2,
        "materialIndex": 0  # Slate
    })

    # 3. Gold Stem
    p3, n3, idx3 = create_box_geometry(0.18, 0.36, 0.18, center=(0.0, 0.46, 0.0))
    parts.append({
        "name": "TrophyStem",
        "positions": p3, "normals": n3, "indices": idx3,
        "materialIndex": 1  # Gold
    })

    # 4. Gold Cup Body
    p4, n4, idx4 = create_box_geometry(0.52, 0.44, 0.52, center=(0.0, 0.86, 0.0))
    parts.append({
        "name": "TrophyCup",
        "positions": p4, "normals": n4, "indices": idx4,
        "materialIndex": 1  # Gold
    })

    # 5. Left Handle
    p5, n5, idx5 = create_box_geometry(0.10, 0.32, 0.10, center=(-0.34, 0.86, 0.0))
    parts.append({
        "name": "HandleLeft",
        "positions": p5, "normals": n5, "indices": idx5,
        "materialIndex": 1  # Gold
    })

    # 6. Right Handle
    p6, n6, idx6 = create_box_geometry(0.10, 0.32, 0.10, center=(0.34, 0.86, 0.0))
    parts.append({
        "name": "HandleRight",
        "positions": p6, "normals": n6, "indices": idx6,
        "materialIndex": 1  # Gold
    })

    # 7. Hero Gem Star (Mounted inside cup crown)
    p7, n7, idx7 = create_octahedron_geometry(0.18, center=(0.0, 1.18, 0.0))
    parts.append({
        "name": "HeroGemStar",
        "positions": p7, "normals": n7, "indices": idx7,
        "materialIndex": 2  # Ruby Gem
    })

    return parts


def export_glb_standalone(out_filepath):
    """Exports a self-contained, fully compliant glTF 2.0 binary (.glb) model."""
    print(f"[MakeAsset] Synthesizing standalone glTF 2.0 binary asset -> {out_filepath}")
    parts = build_trophy_mesh_data()

    # Materials definition
    materials = [
        {
            "name": "ObsidianSlate",
            "pbrMetallicRoughness": {
                "baseColorFactor": [0.12, 0.12, 0.15, 1.0],
                "metallicFactor": 0.1,
                "roughnessFactor": 0.8
            }
        },
        {
            "name": "HeroGold",
            "pbrMetallicRoughness": {
                "baseColorFactor": [1.0, 0.82, 0.05, 1.0],
                "metallicFactor": 0.95,
                "roughnessFactor": 0.22
            }
        },
        {
            "name": "RubyGemstone",
            "pbrMetallicRoughness": {
                "baseColorFactor": [0.95, 0.12, 0.28, 1.0],
                "metallicFactor": 0.3,
                "roughnessFactor": 0.15
            },
            "emissiveFactor": [0.35, 0.02, 0.08]
        }
    ]

    bin_data = bytearray()
    buffer_views = []
    accessors = []
    primitives = []

    def add_buffer_view(data, target=None):
        offset = len(bin_data)
        # Pad to 4-byte boundary
        pad = (4 - (offset % 4)) % 4
        if pad:
            bin_data.extend(b'\x00' * pad)
            offset += pad

        bin_data.extend(data)
        bv = {
            "buffer": 0,
            "byteOffset": offset,
            "byteLength": len(data)
        }
        if target:
            bv["target"] = target
        buffer_views.append(bv)
        return len(buffer_views) - 1

    # Encode mesh parts
    for part in parts:
        pos_f = part["positions"]
        norm_f = part["normals"]
        idx_u = part["indices"]

        # Compute min / max positions
        min_pos = [min(pos_f[i::3]) for i in range(3)]
        max_pos = [max(pos_f[i::3]) for i in range(3)]

        # Pack positions (FLOAT, VEC3)
        pos_bytes = struct.pack(f"<{len(pos_f)}f", *pos_f)
        pos_bv = add_buffer_view(pos_bytes, target=34962)  # ARRAY_BUFFER
        pos_acc = len(accessors)
        accessors.append({
            "bufferView": pos_bv,
            "byteOffset": 0,
            "componentType": 5126,  # FLOAT
            "count": len(pos_f) // 3,
            "type": "VEC3",
            "min": min_pos,
            "max": max_pos
        })

        # Pack normals (FLOAT, VEC3)
        norm_bytes = struct.pack(f"<{len(norm_f)}f", *norm_f)
        norm_bv = add_buffer_view(norm_bytes, target=34962)
        norm_acc = len(accessors)
        accessors.append({
            "bufferView": norm_bv,
            "byteOffset": 0,
            "componentType": 5126,
            "count": len(norm_f) // 3,
            "type": "VEC3"
        })

        # Pack indices (UNSIGNED_SHORT, SCALAR)
        idx_bytes = struct.pack(f"<{len(idx_u)}H", *idx_u)
        idx_bv = add_buffer_view(idx_bytes, target=34963)  # ELEMENT_ARRAY_BUFFER
        idx_acc = len(accessors)
        accessors.append({
            "bufferView": idx_bv,
            "byteOffset": 0,
            "componentType": 5123,  # UNSIGNED_SHORT
            "count": len(idx_u),
            "type": "SCALAR"
        })

        primitives.append({
            "attributes": {
                "POSITION": pos_acc,
                "NORMAL": norm_acc
            },
            "indices": idx_acc,
            "material": part["materialIndex"]
        })

    # Animation Data: 4.0 second seamless loop (TrophyFloat)
    # Samples at t = 0.0, 1.0, 2.0, 3.0, 4.0
    times = [0.0, 1.0, 2.0, 3.0, 4.0]
    time_bytes = struct.pack(f"<{len(times)}f", *times)
    time_bv = add_buffer_view(time_bytes)
    time_acc = len(accessors)
    accessors.append({
        "bufferView": time_bv,
        "byteOffset": 0,
        "componentType": 5126,
        "count": len(times),
        "type": "SCALAR",
        "min": [0.0],
        "max": [4.0]
    })

    # Channel 1: Translation (Floating Y-bob)
    translations = []
    for t in times:
        y_bob = 0.14 * math.sin(2.0 * math.pi * t / 4.0)
        translations.extend([0.0, y_bob, 0.0])
    trans_bytes = struct.pack(f"<{len(translations)}f", *translations)
    trans_bv = add_buffer_view(trans_bytes)
    trans_acc = len(accessors)
    accessors.append({
        "bufferView": trans_bv,
        "byteOffset": 0,
        "componentType": 5126,
        "count": len(times),
        "type": "VEC3"
    })

    # Channel 2: Rotation (360-degree Yaw around Y-axis)
    rotations = []
    for t in times:
        angle = 2.0 * math.pi * t / 4.0
        # Quaternion for Y-axis rotation: (0, sin(angle/2), 0, cos(angle/2))
        qy = math.sin(angle / 2.0)
        qw = math.cos(angle / 2.0)
        rotations.extend([0.0, qy, 0.0, qw])
    rot_bytes = struct.pack(f"<{len(rotations)}f", *rotations)
    rot_bv = add_buffer_view(rot_bytes)
    rot_acc = len(accessors)
    accessors.append({
        "bufferView": rot_bv,
        "byteOffset": 0,
        "componentType": 5126,
        "count": len(times),
        "type": "VEC4"
    })

    # Channel 3: Scale (Gentle breathing pulse)
    scales = []
    for t in times:
        s = 1.0 + 0.05 * math.sin(4.0 * math.pi * t / 4.0)
        scales.extend([s, s, s])
    scale_bytes = struct.pack(f"<{len(scales)}f", *scales)
    scale_bv = add_buffer_view(scale_bytes)
    scale_acc = len(accessors)
    accessors.append({
        "bufferView": scale_bv,
        "byteOffset": 0,
        "componentType": 5126,
        "count": len(times),
        "type": "VEC3"
    })

    # Assemble glTF JSON structure
    gltf = {
        "asset": {
            "version": "2.0",
            "generator": "Blocky Story Engine — MakeAsset Tier C",
            "copyright": "Original IP / CC0 1.0 Universal"
        },
        "scene": 0,
        "scenes": [
            {
                "name": "HeroScene",
                "nodes": [0]
            }
        ],
        "nodes": [
            {
                "name": "HeroTrophyRoot",
                "mesh": 0,
                "translation": [0.0, 0.0, 0.0],
                "rotation": [0.0, 0.0, 0.0, 1.0],
                "scale": [1.0, 1.0, 1.0]
            }
        ],
        "meshes": [
            {
                "name": "HeroTrophyMesh",
                "primitives": primitives
            }
        ],
        "materials": materials,
        "accessors": accessors,
        "bufferViews": buffer_views,
        "buffers": [
            {
                "byteLength": len(bin_data)
            }
        ],
        "animations": [
            {
                "name": "TrophyFloat",
                "samplers": [
                    {"input": time_acc, "interpolation": "LINEAR", "output": trans_acc},
                    {"input": time_acc, "interpolation": "LINEAR", "output": rot_acc},
                    {"input": time_acc, "interpolation": "LINEAR", "output": scale_acc}
                ],
                "channels": [
                    {"sampler": 0, "target": {"node": 0, "path": "translation"}},
                    {"sampler": 1, "target": {"node": 0, "path": "rotation"}},
                    {"sampler": 2, "target": {"node": 0, "path": "scale"}}
                ]
            }
        ]
    }

    # Encode JSON and calculate GLB structure
    json_bytes = json.dumps(gltf, separators=(',', ':')).encode('utf-8')
    json_pad = (4 - (len(json_bytes) % 4)) % 4
    if json_pad:
        json_bytes += b' ' * json_pad

    bin_pad = (4 - (len(bin_data) % 4)) % 4
    if bin_pad:
        bin_data.extend(b'\x00' * bin_pad)

    # GLB Header: magic (4), version (4), length (4)
    # Chunk 0: length (4), type (4), data
    # Chunk 1: length (4), type (4), data
    total_length = 12 + 8 + len(json_bytes) + 8 + len(bin_data)

    glb_file = bytearray()
    glb_file.extend(struct.pack("<4sII", b"glTF", 2, total_length))
    glb_file.extend(struct.pack("<I4s", len(json_bytes), b"JSON"))
    glb_file.extend(json_bytes)
    glb_file.extend(struct.pack("<I4s", len(bin_data), b"BIN\x00"))
    glb_file.extend(bin_data)

    os.makedirs(os.path.dirname(os.path.abspath(out_filepath)), exist_ok=True)
    with open(out_filepath, "wb") as f:
        f.write(glb_file)

    print(f"  ✓ Exported valid glTF 2.0 binary (.glb): {len(glb_file)} bytes")
    print(f"  ✓ Primitives: {len(primitives)} | Materials: {len(materials)} | Accessors: {len(accessors)}")
    print(f"  ✓ Baked Animation Clip: 'TrophyFloat' (4.0s duration, translation+rotation+scale)")
    return out_filepath


def export_glb_blender(out_filepath):
    """Blender execution path using bpy."""
    print(f"[MakeAsset Blender] Running inside Blender {bpy.app.version_string}...")
    bpy.ops.wm.read_factory_settings(use_empty=True)

    # 1. Base pedestal
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 0.08, 0.0), scale=(0.64, 0.16, 0.64))
    pedestal = bpy.context.active_object
    pedestal.name = "PedestalBase"

    # 2. Cup body
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 0.86, 0.0), scale=(0.52, 0.44, 0.52))
    cup = bpy.context.active_object
    cup.name = "TrophyCup"

    # 3. Gem star
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.18, location=(0.0, 1.18, 0.0))
    gem = bpy.context.active_object
    gem.name = "HeroGemStar"

    # Join meshes
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.join()
    trophy = bpy.context.active_object
    trophy.name = "HeroTrophy"

    # Animate float and rotation
    trophy.animation_data_create()
    action = bpy.data.actions.new(name="TrophyFloat")
    trophy.animation_data.action = action

    # Keyframe 0s (frame 1)
    trophy.location = (0.0, 0.0, 0.0)
    trophy.rotation_euler = (0.0, 0.0, 0.0)
    trophy.keyframe_insert(data_path="location", frame=1)
    trophy.keyframe_insert(data_path="rotation_euler", frame=1)

    # Keyframe 2s (frame 60 @ 30fps)
    trophy.location = (0.0, 0.14, 0.0)
    trophy.rotation_euler = (0.0, math.pi, 0.0)
    trophy.keyframe_insert(data_path="location", frame=60)
    trophy.keyframe_insert(data_path="rotation_euler", frame=60)

    # Keyframe 4s (frame 120 @ 30fps)
    trophy.location = (0.0, 0.0, 0.0)
    trophy.rotation_euler = (0.0, 2 * math.pi, 0.0)
    trophy.keyframe_insert(data_path="location", frame=120)
    trophy.keyframe_insert(data_path="rotation_euler", frame=120)

    os.makedirs(os.path.dirname(os.path.abspath(out_filepath)), exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=out_filepath, export_format='GLB', export_animations=True)
    print(f"[MakeAsset Blender] Successfully exported glTF to: {out_filepath}")
    return out_filepath


def main():
    # Handle arguments passed after "--" when running inside Blender
    raw_args = sys.argv[1:]
    if "--" in raw_args:
        raw_args = raw_args[raw_args.index("--") + 1:]

    parser = argparse.ArgumentParser(description="Headless Asset Generator & Exporter (Tier C)")
    parser.add_argument("--asset", default="trophy", help="Asset identifier to generate (e.g. trophy, chest, duck)")
    parser.add_argument("--out", default=os.path.join("blocky", "assets", "models", "hero_trophy.glb"), help="Output .glb filepath")

    args = parser.parse_args(raw_args)

    if IS_BLENDER:
        export_glb_blender(args.out)
    else:
        export_glb_standalone(args.out)


if __name__ == "__main__":
    main()

