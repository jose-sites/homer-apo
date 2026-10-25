"""Blender 4.x: export bxbrenden/Homer-3D-Blender with baked rig, no facial animation."""
import bpy,sys,json,os
from mathutils import Matrix
source=sys.argv[sys.argv.index('--')+1] if '--' in sys.argv else '/workspace/homer-assets/homer.blend'
bpy.ops.wm.open_mainfile(filepath=source)
scene=bpy.context.scene;scene.frame_set(1)
rig=bpy.data.objects['Armature'];body=bpy.data.objects['Geo-Body']
rig.hide_set(False);rig.hide_render=False;rig.hide_viewport=False
# Preserve the original world orientation, discard demonstration scene parenting/motion.
world=rig.matrix_world.copy();rig.parent=None;rig.matrix_world=world
for o in list(bpy.data.objects):
 if o not in [rig,body]:bpy.data.objects.remove(o,do_unlink=True)
for m in body.modifiers:
 if m.type=='SUBSURF':m.levels=1;m.render_levels=1
if body.data.shape_keys:
 body.data.shape_keys.animation_data_clear()
 for key in body.data.shape_keys.key_blocks:key.value=0
# Bake symmetry and subdivision into the mesh, retaining armature weights.
# Exporting the raw mesh would export only the modeled half of Homer.
body.shape_key_clear()
bpy.context.view_layer.objects.active=body
body.hide_set(False)
for modifier in list(body.modifiers):
 if modifier.type in ['MIRROR','SUBSURF']:
  bpy.ops.object.modifier_apply(modifier=modifier.name)
act=rig.animation_data.action
act.name='Walk'
for f in list(act.fcurves):
 if not f.data_path.startswith('pose.bones'):
  act.fcurves.remove(f);continue
 # Keep a complete repeating gait, not the multi-minute showcase timeline.
 for i in range(len(f.keyframe_points)-1,-1,-1):
  if f.keyframe_points[i].co.x>73:f.keyframe_points.remove(f.keyframe_points[i],fast=True)
scene.frame_start=1;scene.frame_end=73;scene.frame_set(1)
# Avoid unrelated shader animation from the showcase.
for mat in bpy.data.materials:
 if mat.node_tree:mat.node_tree.animation_data_clear()
for a in list(bpy.data.actions):
 if a!=act:bpy.data.actions.remove(a)
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True);body.select_set(True);bpy.context.view_layer.objects.active=rig
os.makedirs('public/models/homer',exist_ok=True)
bpy.ops.export_scene.gltf(filepath=os.path.abspath('public/models/homer/homer.glb'),export_format='GLB',use_selection=True,export_animations=True,export_frame_range=True,export_force_sampling=True,export_def_bones=False,export_morph=False,export_skins=True,export_apply=False,export_extras=True)
print('HOMER_EXPORTED',len(body.data.vertices),'source vertices',len(rig.data.bones),'bones')
