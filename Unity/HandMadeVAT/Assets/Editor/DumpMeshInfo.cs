using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEditor;

public class DumpMeshInfo : MonoBehaviour
{
    [MenuItem("Assets/Dump Mesh info")]
    static void ExecDumpMeshInfo()
    {
        Debug.Log("Dump mesh info");

        if(Selection.objects.Length == 0)
        {
            EditorUtility.DisplayDialog("Dump Mesh info", "No item selected.", "OK");
            return;
        }
        
        var dumpedMsgs = new Dictionary<string, string>(Selection.objects.Length);
        var infoTmpList = new List<string>();

        foreach (var obj in Selection.objects)
        {
            Mesh mesh = null;
            var objType = obj.GetType();
            if (objType == typeof(GameObject))
            {
                mesh = ((GameObject)obj)?.GetComponent<MeshFilter>()?.sharedMesh;
            }
            else if(objType == typeof(Mesh))
            {
                mesh = (Mesh)obj;
            }
            
            if(mesh != null)
            {
                var path = AssetDatabase.GetAssetPath((Object)mesh);
                if (dumpedMsgs.ContainsKey(path))
                {
                    continue;
                }
                

                infoTmpList.Clear();
                infoTmpList.Add($"--- {mesh.name} @{path} ---");

                infoTmpList.Add($"vertice:{mesh.vertexCount}");
                infoTmpList.Add($"faces:{mesh.triangles.Length / 3}");
                infoTmpList.Add($"uv1:{mesh.uv.Length}");
                if (mesh.uv.Length > 0 && mesh.uv2.Length == 0)
                {
                    for (int i = 0; i < mesh.triangles.Length && i < 16; i++)
                    {
                        int vid = mesh.triangles[i];
                        var uv = mesh.uv[vid];
                        infoTmpList.Add($"  tri[{i / 3}].uv1[{vid}]:({uv.x}, {uv.y})");
                    }
                }
                infoTmpList.Add($"uv2:{mesh.uv2.Length}");
                if (mesh.uv2.Length > 0)
                {
                    for (int i = 0; i < mesh.triangles.Length && i < 16; i++)
                    {
                        int vid = mesh.triangles[i];
                        var uv2 = mesh.uv2[vid];
                        infoTmpList.Add($"  tri[{i / 3}].uv2[{vid}]:({uv2.x}, {uv2.y})");
                    }
                }

                infoTmpList.Add($"colors:{mesh.colors.Length}");
                if (mesh.colors.Length > 0)
                {
                    for (int i = 0; i < mesh.triangles.Length && i < 16; i++)
                    {
                        int vid = mesh.triangles[i];
                        var col = mesh.colors[vid];
                        infoTmpList.Add($"  tri[{i / 3}].color[{vid}]:({col.r},{col.g},{col.b},{col.a})");
                    }
                }

                dumpedMsgs.Add(path, string.Join("\n  ", infoTmpList));
            }
        }

        if (dumpedMsgs.Count > 0)
        {
            var joinedMsg = string.Join("\n", dumpedMsgs.Values);
            Debug.Log(joinedMsg);
        }
        else
        {
            Debug.Log("No Mesh assets selected.");
        }
        
    }
}
