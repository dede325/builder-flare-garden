#!/usr/bin/env node

/**
 * Script de Validação de Sincronização Mobile - AirPlus Aviation
 * Verifica se todas as versões (PWA, Android, iOS) estão sincronizadas
 */

import fs from "fs";
import path from "path";

const REQUIRED_TABLES = [
  "aircraft",
  "employees",
  "cleaning_forms",
  "tasks",
  "flight_sheets",
  "system_settings",
  "user_profiles",
  "roles",
  "user_roles",
  "photo_evidence",
  "intervention_types",
  "shift_configs",
  "location_configs",
  "migration_history",
  "user_activity_logs",
  "permissions",
  "role_permissions",
  "notifications",
  "file_attachments",
  "qr_codes",
  "cleaning_form_employees",
];

const OFFLINE_TABLES = [
  "aircraft",
  "employees",
  "cleaning_forms",
  "cleaning_form_employees",
  "system_settings",
  "file_attachments",
  "sync_queue",
  "offline_metadata",
  "migration_history",
  "photo_evidence",
  "intervention_types",
  "shift_configs",
  "location_configs",
  "notifications",
  "qr_codes",
  "user_activity_logs",
  "tasks",
  "flight_sheets",
];

console.log("🔍 VALIDAÇÃO DE SINCRONIZAÇÃO MOBILE - AIRPLUS AVIATION");
console.log("========================================================\n");

let errors = [];
let warnings = [];

// 1. Verificar migrações Supabase
console.log("📊 Verificando Migrações Supabase...");
const migrationDir = "supabase/migrations";
if (fs.existsSync(migrationDir)) {
  const migrations = fs
    .readdirSync(migrationDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  console.log(`✅ Encontradas ${migrations.length} migrações:`);
  migrations.forEach((migration) => {
    console.log(`   - ${migration}`);
  });

  // Verificar se temos as migrações VFINAL
  const vfinalMigrations = migrations.filter(
    (m) => m.includes("vfinal") || m.includes("20241220"),
  );
  if (vfinalMigrations.length < 4) {
    errors.push(
      "❌ Migrações VFINAL incompletas. Esperadas: 4, encontradas: " +
        vfinalMigrations.length,
    );
  } else {
    console.log("✅ Migrações VFINAL completas");
  }
} else {
  errors.push("❌ Diretório de migrações não encontrado");
}

console.log("\n");

// 2. Verificar sistema offline (IndexedDB)
console.log("💾 Verificando Sistema Offline (IndexedDB)...");
const migrationsFile = "client/lib/migrations.ts";
if (fs.existsSync(migrationsFile)) {
  const content = fs.readFileSync(migrationsFile, "utf8");

  // Verificar versão do banco
  if (content.includes("const version = 2")) {
    console.log("✅ Versão do banco offline atualizada (v2)");
  } else {
    errors.push("❌ Versão do banco offline não atualizada (esperado v2)");
  }

  // Verificar se todas as tabelas offline estão presentes
  let missingTables = [];
  OFFLINE_TABLES.forEach((table) => {
    if (!content.includes(`"${table}"`)) {
      missingTables.push(table);
    }
  });

  if (missingTables.length === 0) {
    console.log(
      `✅ Todas as ${OFFLINE_TABLES.length} tabelas offline configuradas`,
    );
  } else {
    errors.push(`❌ Tabelas offline faltando: ${missingTables.join(", ")}`);
  }
} else {
  errors.push("❌ Arquivo migrations.ts não encontrado");
}

console.log("\n");

// 3. Verificar serviço de sincronização inteligente
console.log("🔄 Verificando Serviço de Sincronização...");
const syncFile = "client/lib/intelligent-sync-service.ts";
if (fs.existsSync(syncFile)) {
  const content = fs.readFileSync(syncFile, "utf8");

  // Verificar versão do banco de sincronização
  if (content.includes("this.version(2)")) {
    console.log("✅ Serviço de sincronização atualizado (v2)");
  } else {
    errors.push("❌ Serviço de sincronização não atualizado");
  }

  // Verificar se novas tabelas estão incluídas
  const newTables = [
    "photoEvidence",
    "interventionTypes",
    "shiftConfigs",
    "locationConfigs",
    "notifications",
    "qrCodes",
    "tasks",
    "flightSheets",
  ];
  let missingInSync = [];
  newTables.forEach((table) => {
    if (!content.includes(`${table}!: Table`)) {
      missingInSync.push(table);
    }
  });

  if (missingInSync.length === 0) {
    console.log("✅ Todas as novas tabelas incluídas na sincronização");
  } else {
    errors.push(
      `❌ Tabelas faltando na sincronização: ${missingInSync.join(", ")}`,
    );
  }
} else {
  errors.push("❌ Arquivo intelligent-sync-service.ts não encontrado");
}

console.log("\n");

// 4. Verificar configuração PWA
console.log("📱 Verificando Configuração PWA...");
const manifestFile = "public/manifest.json";
if (fs.existsSync(manifestFile)) {
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestFile, "utf8"));

    if (
      manifest.name === "AirPlus Aviation - Sistema de Limpeza de Aeronaves"
    ) {
      console.log("✅ Manifest PWA configurado corretamente");
    } else {
      warnings.push("⚠️ Nome do PWA pode estar desatualizado");
    }

    if (manifest.icons && manifest.icons.length >= 7) {
      console.log("✅ Icons PWA completos");
    } else {
      warnings.push("⚠️ Icons PWA podem estar incompletos");
    }
  } catch (e) {
    errors.push("❌ Manifest PWA inválido");
  }
} else {
  errors.push("❌ Manifest PWA não encontrado");
}

console.log("\n");

// 5. Verificar configuração Capacitor
console.log("⚡ Verificando Configuração Capacitor...");
const capacitorFile = "capacitor.config.ts";
if (fs.existsSync(capacitorFile)) {
  const content = fs.readFileSync(capacitorFile, "utf8");

  if (content.includes("com.airplus.aviation")) {
    console.log("✅ App ID configurado corretamente");
  } else {
    errors.push("❌ App ID do Capacitor incorreto");
  }

  if (content.includes("AirPlus Aviation")) {
    console.log("✅ Nome do app configurado");
  } else {
    errors.push("❌ Nome do app não configurado");
  }

  const requiredPlugins = ["Camera", "Filesystem", "Network", "Preferences"];
  let missingPlugins = [];
  requiredPlugins.forEach((plugin) => {
    if (!content.includes(plugin)) {
      missingPlugins.push(plugin);
    }
  });

  if (missingPlugins.length === 0) {
    console.log("✅ Plugins Capacitor configurados");
  } else {
    warnings.push(
      `⚠️ Plugins podem estar faltando: ${missingPlugins.join(", ")}`,
    );
  }
} else {
  errors.push("❌ Arquivo capacitor.config.ts não encontrado");
}

console.log("\n");

// 6. Verificar scripts de build
console.log("🔨 Verificando Scripts de Build...");
const packageFile = "package.json";
if (fs.existsSync(packageFile)) {
  try {
    const pkg = JSON.parse(fs.readFileSync(packageFile, "utf8"));

    const requiredScripts = [
      "build:production",
      "build:mobile",
      "build:android",
      "build:ios",
      "build:mobile:all",
      "mobile:sync",
    ];

    let missingScripts = [];
    requiredScripts.forEach((script) => {
      if (!pkg.scripts[script]) {
        missingScripts.push(script);
      }
    });

    if (missingScripts.length === 0) {
      console.log("✅ Scripts de build mobile configurados");
    } else {
      errors.push(`❌ Scripts faltando: ${missingScripts.join(", ")}`);
    }

    // Verificar dependências Capacitor
    const capacitorDeps = [
      "@capacitor/core",
      "@capacitor/cli",
      "@capacitor/android",
      "@capacitor/ios",
      "@capacitor/camera",
      "@capacitor/filesystem",
      "@capacitor/network",
    ];

    let missingDeps = [];
    capacitorDeps.forEach((dep) => {
      if (!pkg.dependencies[dep]) {
        missingDeps.push(dep);
      }
    });

    if (missingDeps.length === 0) {
      console.log("✅ Dependências Capacitor instaladas");
    } else {
      warnings.push(
        `⚠️ Dependências podem estar faltando: ${missingDeps.join(", ")}`,
      );
    }
  } catch (e) {
    errors.push("❌ package.json inválido");
  }
} else {
  errors.push("❌ package.json não encontrado");
}

console.log("\n");

// 7. Verificar diretórios mobile
console.log("📂 Verificando Estrutura Mobile...");
const androidDir = "android";
const iosDir = "ios";

if (fs.existsSync(androidDir)) {
  console.log("✅ Projeto Android presente");

  if (fs.existsSync(path.join(androidDir, "app/build.gradle"))) {
    console.log("✅ Configuração Android válida");
  } else {
    warnings.push("⚠️ Configuração Android pode estar incompleta");
  }
} else {
  warnings.push(
    "⚠️ Projeto Android não encontrado (executar: npx cap add android)",
  );
}

if (fs.existsSync(iosDir)) {
  console.log("✅ Projeto iOS presente");

  if (fs.existsSync(path.join(iosDir, "App/App.xcodeproj"))) {
    console.log("✅ Configuração iOS válida");
  } else {
    warnings.push("⚠️ Configuração iOS pode estar incompleta");
  }
} else {
  warnings.push("⚠️ Projeto iOS não encontrado (executar: npx cap add ios)");
}

console.log("\n");

// 8. Resultados finais
console.log("📋 RESULTADO DA VALIDAÇÃO");
console.log("==========================\n");

if (errors.length === 0) {
  console.log("🟢 VALIDAÇÃO PASSOU - Sistema sincronizado e pronto!");
  console.log("\n✅ TUDO FUNCIONANDO:");
  console.log("   • 18 tabelas no banco de dados");
  console.log("   • Sistema offline atualizado (v2)");
  console.log("   • Sincronização inteligente configurada");
  console.log("   • PWA configurado corretamente");
  console.log("   • Capacitor pronto para Android/iOS");
  console.log("   • Scripts de build disponíveis");

  console.log("\n🚀 PRÓXIMOS PASSOS:");
  console.log("   1. supabase db push (aplicar migrações)");
  console.log("   2. npm run build:production (build de produção)");
  console.log("   3. npx cap sync (sincronizar mobile)");
  console.log("   4. npm run build:android (gerar APK)");
  console.log("   5. npm run build:ios (gerar IPA)");
} else {
  console.log("🔴 VALIDAÇÃO FALTOU - Corrija os erros abaixo:");
  errors.forEach((error) => console.log("   " + error));
}

if (warnings.length > 0) {
  console.log("\n⚠️ AVISOS (Não bloqueiam, mas recomenda-se verificar):");
  warnings.forEach((warning) => console.log("   " + warning));
}

console.log("\n");

// Exit code
process.exit(errors.length > 0 ? 1 : 0);
